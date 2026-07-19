/* ============================================================================
   Le Livre des Morts — logique de l'application (PWA)
   État de partie persisté en localStorage. Une partie active à la fois.
   ========================================================================== */
'use strict';

const LS_KEY = 'ldm_session_v1';
const M = DATA.meta;

/* ---------- État / persistance ------------------------------------------- */
function defaultSession() {
  return {
    numero: 1,
    hero: { blessures: 0, ceinture: null, mainDroite: null, mainGauche: null, deuxMains: null },
    backpack: {},                 // { itemId: qty }
    munitions: { Cartouche: 0, Balle: 0 },
    special: [],                  // objets spéciaux (texte libre)
    archives: [],                 // archives (texte libre)
    car: { degats: 0, essence: M.carEssenceMax, coffre: {}, compagnons: { Terry: null, Sergio: null, Carole: null } },
    companions: { Terry: { mission: '' }, Sergio: { mission: '' }, Carole: { mission: '' } },
    codes: {},                    // { BANG: true }
    paragraphs: [],               // n° cochés
    paraObjets: {},               // { "16": [true,false,...] }
    fabrication: { renamed: {}, recipes: {} },   // remis à zéro chaque session
    combat: null,                 // combat en cours
  };
}

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return Object.assign(defaultSession(), JSON.parse(raw));
  } catch (e) { console.warn(e); }
  return defaultSession();
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { console.warn(e); } }

/* Accès par chemin "hero.blessures" / "car.essence" */
function getPath(p) { return p.split('.').reduce((o, k) => (o == null ? o : o[k]), S); }
function setPath(p, v) {
  const ks = p.split('.'); const last = ks.pop();
  const o = ks.reduce((o, k) => o[k], S); o[last] = v;
}

/* ---------- Petits utilitaires ------------------------------------------- */
const $ = sel => document.querySelector(sel);
const screen = $('#screen');
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function d6() { return 1 + Math.floor(Math.random() * 6); }

/* Nom affiché d'un objet (gère le renommage des Objet#X pour la session) */
function itemName(id) {
  const it = DATA.itemById[id]; if (!it) return id;
  if (it.masked && S.fabrication.renamed[id]) return S.fabrication.renamed[id] + ' (' + it.name + ')';
  return it.name;
}
function itemPlace(id) { const it = DATA.itemById[id]; return it && it.placeSac != null ? it.placeSac : 0; }

/* ---------- Inventaire : possessions et places --------------------------- */
function backpackUsed() {
  return Object.entries(S.backpack).reduce((n, [id, q]) => n + itemPlace(id) * q, 0);
}
function ownedQty(id) {
  let n = (S.backpack[id] || 0) + (S.car.coffre[id] || 0);
  ['ceinture', 'mainDroite', 'mainGauche', 'deuxMains'].forEach(s => { if (S.hero[s] && S.hero[s].itemId === id) n++; });
  return n;
}
function addToBackpack(id, q = 1) { S.backpack[id] = (S.backpack[id] || 0) + q; if (S.backpack[id] <= 0) delete S.backpack[id]; }
function addToCoffre(id, q = 1) { S.car.coffre[id] = (S.car.coffre[id] || 0) + q; if (S.car.coffre[id] <= 0) delete S.car.coffre[id]; }

/* ---------- Router -------------------------------------------------------- */
const ROUTES = {};
let stack = ['home'];
function route(name, opts = {}) {
  if (opts.replace) stack[stack.length - 1] = name; else if (name !== stack[stack.length - 1]) stack.push(name);
  render();
}
function back() { if (stack.length > 1) stack.pop(); render(); }

function render() {
  const name = stack[stack.length - 1];
  const r = ROUTES[name] || ROUTES.home;
  screen.innerHTML = r.html();
  $('#screenTitle').innerHTML = name === 'home'
    ? 'Le Livre des Morts<small>Compagnon de jeu</small>'
    : esc(r.title) + '<small>' + esc(r.sub || '') + '</small>';
  $('#btnBack').classList.toggle('hidden', name === 'home');
  $('#sessionBadge').textContent = 'Session ' + S.numero;
  if (r.after) r.after();
  save();
}

/* ============================================================================
   ÉCRAN : ACCUEIL
   ========================================================================== */
ROUTES.home = {
  title: 'Accueil',
  html() {
    const carAlert = (S.car.degats >= M.carDegatsMax || S.car.essence <= 0);
    const heroAlert = S.hero.blessures >= M.heroBlessuresMax;
    const tiles = [
      ['combat', '⚔️', 'Combat', 'adversaires + assauts', false],
      ['hero', '🧍', 'Héros', S.hero.blessures + '/' + M.heroBlessuresMax + ' blessures', heroAlert],
      ['backpack', '🎒', 'Sac à dos', backpackUsed() + '/' + M.backpackMax + ' places', false],
      ['car', '🚗', 'Voiture', 'dégâts ' + S.car.degats + ' · ess. ' + S.car.essence, carAlert],
      ['companions', '👥', 'Compagnons', 'missions & compétences', false],
      ['codes', '🔤', 'Codes provisoires', codesCount() + '/' + DATA.codes.length + ' cochés', false],
      ['paragraphs', '📑', 'Paragraphes cochés', S.paragraphs.length + ' cochés', false],
      ['paraObjets', '🎁', 'Paragraphes-objets', 'récupérer des objets', false],
      ['fabrication', '🔧', 'Fabrication', 'calculateur + recettes', false],
      ['abecedaire', '📖', 'Abécédaire objets', 'armes & objets', false],
      ['craftref', '🧰', 'Objets fabrication', 'consommables & outils', false],
      ['rules', '📜', 'Rappel des règles', '', false],
    ];
    return `
      <div class="home-grid">
        ${tiles.map(([id, ico, lbl, sub, isAlert]) =>
          `<button class="tile ${isAlert ? 'alert' : ''}" data-route="${id}">
             <span class="ico">${ico}</span><span class="lbl">${lbl}</span><span class="sub">${esc(sub)}</span>
           </button>`).join('')}
      </div>
      <div class="card" style="margin-top:12px">
        <div class="row">
          <div class="grow"><b>Session ${S.numero}</b><div class="muted">Tout est sauvegardé automatiquement.</div></div>
        </div>
        <div class="row wrap" style="margin-top:10px">
          <button class="btn sm" data-action="session-num">N° de session…</button>
          <button class="btn sm danger" data-action="new-session">Nouvelle partie</button>
        </div>
      </div>`;
  },
};
function codesCount() { return DATA.codes.filter(c => S.codes[c]).length; }

/* ============================================================================
   ÉCRAN : HÉROS
   ========================================================================== */
const SLOTS = [
  ['deuxMains', 'Arme à 2 mains'],
  ['mainDroite', 'Main droite'],
  ['mainGauche', 'Main gauche'],
  ['ceinture', 'Ceinture (secours)'],
];
function slotWeaponHtml(key) {
  const s = S.hero[key];
  if (!s) return `<div class="muted">— vide —</div>
      <button class="btn sm" data-action="equip" data-slot="${key}" style="margin-top:6px">＋ Équiper</button>`;
  const w = DATA.itemById[s.itemId];
  const dur = w.durabilite === 'infinie' ? '∞' : (s.durabilityUsed || 0) + '/' + w.durabilite;
  return `<div class="row"><div class="grow"><div class="name">${esc(itemName(s.itemId))}</div>
      <div class="meta">${esc(w.type || '')} · durabilité ${dur}${w.munition ? ' · ' + w.munition : ''}</div></div>
      <button class="btn sm ghost" data-action="unequip" data-slot="${key}">Retirer</button></div>`;
}
ROUTES.hero = {
  title: 'Héros', sub: 'état & équipement',
  html() {
    const b = S.hero.blessures, pct = Math.min(100, b / M.heroBlessuresMax * 100);
    const cls = b >= M.heroBlessuresMax ? 'danger' : b >= M.heroBlessuresMax * 0.7 ? 'warn' : '';
    return `
      <div class="card">
        <h2>Blessures</h2>
        <div class="stepper">
          <button data-action="step" data-path="hero.blessures" data-delta="-1" data-min="0">−</button>
          <div class="val">${b}<span class="max">/ ${M.heroBlessuresMax}</span></div>
          <button data-action="step" data-path="hero.blessures" data-delta="1" data-max="${M.heroBlessuresMax}">＋</button>
          <div class="spacer"></div>
          <button class="btn sm" data-action="heal10">Kit médical −10</button>
        </div>
        <div class="bar ${cls}"><span style="width:${pct}%"></span></div>
        ${b >= M.heroBlessuresMax ? '<div class="tag-danger" style="margin-top:8px">☠ 30 blessures atteintes — l\'aventure se termine.</div>' : ''}
      </div>
      <div class="section-title">Équipement (4 emplacements)</div>
      ${SLOTS.map(([k, lbl]) => `<div class="slot ${S.hero[k] ? 'filled' : ''}"><div class="slot-lbl">${lbl}</div>${slotWeaponHtml(k)}</div>`).join('')}
      <div class="muted" style="margin-top:6px">Règles : une arme à 2 mains interdit les deux mains ; la ceinture n'accepte qu'une arme à 1 main. Les armes équipées ne comptent pas dans le sac.</div>`;
  },
};

/* Peut-on équiper cette arme dans ce slot ? */
function canEquip(w, slot) {
  const oneHand = w.mode === '1main' || w.mode === '1ou2' || w.type === 'Objet';
  const twoHand = w.mode === '2mains' || w.mode === '1ou2';
  if (slot === 'deuxMains') return twoHand;
  if (slot === 'ceinture') return (w.mode === '1main' || w.mode === '1ou2');
  return oneHand; // mains
}
function openEquip(slot) {
  const list = DATA.weapons.filter(w => canEquip(w, slot));
  const rows = list.map(w => {
    const owned = ownedQty(w.id);
    return `<div class="item"><div class="grow"><div class="name">${esc(itemName(w.id))} ${w.masked ? '<span class="pill masked">?</span>' : ''}</div>
      <div class="meta">${esc(w.type)} · ${w.mode || '—'} ${owned ? '· <span class="tag-ok">possédé ×' + owned + '</span>' : '· non possédé'}</div></div>
      <button class="btn sm primary" data-action="equip-pick" data-slot="${slot}" data-id="${w.id}">Choisir</button></div>`;
  }).join('');
  modal('Équiper — ' + SLOTS.find(s => s[0] === slot)[1], rows || '<div class="muted">Aucune arme compatible.</div>');
}
function doEquip(slot, id) {
  const w = DATA.itemById[id];
  // Contraintes croisées
  if (slot === 'deuxMains' && (S.hero.mainDroite || S.hero.mainGauche)) {
    if (!confirm('Équiper une arme à 2 mains libère les deux mains. Continuer ?')) return;
    unequip('mainDroite', true); unequip('mainGauche', true);
  }
  if ((slot === 'mainDroite' || slot === 'mainGauche') && S.hero.deuxMains) {
    if (!confirm('Vous tenez une arme à 2 mains : la ranger d\'abord ?')) return;
    unequip('deuxMains', true);
  }
  // Sort de l'inventaire s'il y est (ne compte plus dans le sac)
  if (S.backpack[id]) addToBackpack(id, -1); else if (S.car.coffre[id]) addToCoffre(id, -1);
  S.hero[slot] = { itemId: id, durabilityUsed: 0 };
  closeModal(); toast(itemName(id) + ' équipé'); render();
}
function unequip(slot, silent) {
  const s = S.hero[slot]; if (!s) return;
  addToBackpack(s.itemId, 1); S.hero[slot] = null;
  if (!silent) { toast(itemName(s.itemId) + ' rangé au sac'); render(); }
}

/* ============================================================================
   ÉCRAN : SAC À DOS
   ========================================================================== */
ROUTES.backpack = {
  title: 'Sac à dos', sub: '10 emplacements',
  html() {
    const used = backpackUsed(), free = M.backpackMax - used;
    const cls = used > M.backpackMax ? 'danger' : used >= M.backpackMax * 0.8 ? 'warn' : '';
    const contenu = Object.entries(S.backpack).filter(([, q]) => q > 0);
    return `
      <div class="card">
        <div class="row"><div class="grow"><h2 style="margin:0">Occupation</h2>
          <div class="muted">${used} occupés · ${free < 0 ? '<span class="tag-danger">' + free + '</span>' : free + ' libres'}</div></div>
          <div class="val" style="font-size:26px;font-weight:800">${used}<span class="max" style="font-size:13px;color:var(--txt-dim)">/${M.backpackMax}</span></div>
        </div>
        <div class="bar ${cls}"><span style="width:${Math.min(100, used / M.backpackMax * 100)}%"></span></div>
      </div>

      <div class="section-title">Contenu</div>
      ${contenu.length ? contenu.map(([id, q]) => bpItemRow(id, q)).join('') : '<div class="muted">Sac vide.</div>'}

      <div class="section-title">Munitions (0 place)</div>
      ${DATA.munitionTypes.map(m => `<div class="item"><div class="grow"><div class="name">${m}</div></div>
        <div class="stepper"><button data-action="step" data-path="munitions.${m}" data-delta="-1" data-min="0">−</button>
        <div class="val" style="min-width:40px">${S.munitions[m] || 0}</div>
        <button data-action="step" data-path="munitions.${m}" data-delta="1">＋</button></div></div>`).join('')}

      <div class="row" style="margin-top:14px">
        <button class="btn full primary" data-action="add-item">＋ Ajouter un objet au sac</button>
      </div>

      <div class="section-title">Objets spéciaux (0 place)</div>
      ${listEditor('special')}
      <div class="section-title">Archives (0 place)</div>
      ${listEditor('archives')}`;
  },
};
function bpItemRow(id, q) {
  const it = DATA.itemById[id];
  return `<div class="item"><div class="grow"><div class="name">${esc(itemName(id))}</div>
      <div class="meta">${itemPlace(id)} pl./u · total ${itemPlace(id) * q} ${it.usage === 'outil' ? '<span class="pill tool">outil</span>' : ''}</div></div>
      <div class="stepper"><button data-action="bp" data-id="${id}" data-delta="-1">−</button>
      <div class="val" style="min-width:40px">${q}</div>
      <button data-action="bp" data-id="${id}" data-delta="1">＋</button></div></div>`;
}
function listEditor(field) {
  const arr = S[field];
  return `<div>${arr.map((t, i) => `<div class="item"><div class="grow">${esc(t)}</div>
      <button class="btn sm ghost" data-action="list-del" data-field="${field}" data-i="${i}">✕</button></div>`).join('')}
    <div class="row"><input type="text" data-listinput="${field}" placeholder="Ajouter…">
      <button class="btn sm" data-action="list-add" data-field="${field}">＋</button></div></div>`;
}
function openAddItem() {
  const all = [...DATA.weapons.filter(w => w.placeSac != null), ...DATA.craftItems];
  const rows = all.map(it => `<div class="item"><div class="grow"><div class="name">${esc(itemName(it.id))}</div>
      <div class="meta">${it.placeSac} place(s)/u ${it.usage ? '· ' + it.usage : '· ' + (it.type || '')}</div></div>
      <button class="btn sm primary" data-action="bp-add" data-id="${it.id}">＋ Sac</button></div>`).join('');
  modal('Ajouter au sac', rows);
}

/* ============================================================================
   ÉCRAN : VOITURE
   ========================================================================== */
ROUTES.car = {
  title: 'Voiture', sub: 'Camaro',
  html() {
    const c = S.car, dAlert = c.degats >= M.carDegatsMax, eAlert = c.essence <= 0;
    const coffre = Object.entries(c.coffre).filter(([, q]) => q > 0);
    const slots = [1, 2, 3];
    return `
      ${(dAlert || eAlert) ? `<div class="card alert"><div class="tag-danger">⚠ ${dAlert ? 'La Camaro a atteint 30 dégâts.' : ''} ${eAlert ? 'Plus d\'essence.' : ''} → Rendez-vous au paragraphe 200.</div></div>` : ''}
      <div class="card">
        <h2>Dégâts</h2>
        <div class="stepper">
          <button data-action="step" data-path="car.degats" data-delta="-1" data-min="0">−</button>
          <div class="val">${c.degats}<span class="max">/ ${M.carDegatsMax}</span></div>
          <button data-action="step" data-path="car.degats" data-delta="1" data-max="${M.carDegatsMax}">＋</button>
        </div>
        <div class="bar ${dAlert ? 'danger' : c.degats >= 21 ? 'warn' : ''}"><span style="width:${Math.min(100, c.degats / M.carDegatsMax * 100)}%"></span></div>
      </div>
      <div class="card">
        <h2>Essence (litres)</h2>
        <div class="stepper">
          <button data-action="step" data-path="car.essence" data-delta="-5" data-min="0">−5</button>
          <button data-action="step" data-path="car.essence" data-delta="-1" data-min="0">−</button>
          <div class="val">${c.essence}<span class="max">/ ${M.carEssenceMax}</span></div>
          <button data-action="step" data-path="car.essence" data-delta="1" data-max="${M.carEssenceMax}">＋</button>
          <button data-action="step" data-path="car.essence" data-delta="5" data-max="${M.carEssenceMax}">+5</button>
        </div>
        <div class="bar ${eAlert ? 'danger' : c.essence <= 15 ? 'warn' : ''}"><span style="width:${Math.min(100, c.essence / M.carEssenceMax * 100)}%"></span></div>
      </div>
      <div class="card">
        <h2>Compagnons dans la voiture (3 places)</h2>
        ${slots.map(n => {
          const occ = Object.keys(c.compagnons).find(k => c.compagnons[k] === n);
          return `<div class="row" style="margin-bottom:8px"><span class="pill">Place ${n}</span>
            <select data-carslot="${n}" class="grow">
              <option value="">— libre —</option>
              ${DATA.companions.map(co => `<option value="${co.nom}" ${occ === co.nom ? 'selected' : ''}>${co.nom}</option>`).join('')}
            </select></div>`;
        }).join('')}
        <div class="muted">Chaque compagnon occupe une place unique.</div>
      </div>
      <div class="card">
        <div class="row"><h2 style="margin:0" class="grow">Coffre (illimité)</h2>
          <button class="btn sm primary" data-action="add-coffre">＋ Objet</button></div>
        ${coffre.length ? coffre.map(([id, q]) => `<div class="item"><div class="grow"><div class="name">${esc(itemName(id))}</div><div class="meta">×${q}</div></div>
          <div class="stepper"><button data-action="coffre" data-id="${id}" data-delta="-1">−</button><div class="val" style="min-width:36px">${q}</div>
          <button data-action="coffre" data-id="${id}" data-delta="1">＋</button></div></div>`).join('') : '<div class="muted">Coffre vide.</div>'}
      </div>`;
  },
};
function openAddCoffre() {
  const all = [...DATA.weapons.filter(w => w.id !== 'mainsnues'), ...DATA.craftItems];
  const rows = all.map(it => `<div class="item"><div class="grow"><div class="name">${esc(itemName(it.id))}</div>
      <div class="meta">${it.usage || it.type || ''}</div></div>
      <button class="btn sm primary" data-action="coffre-add" data-id="${it.id}">＋ Coffre</button></div>`).join('');
  modal('Ajouter au coffre', rows);
}

/* ============================================================================
   ÉCRAN : COMPAGNONS
   ========================================================================== */
ROUTES.companions = {
  title: 'Compagnons', sub: 'missions & compétences',
  html() {
    return DATA.companions.map(co => {
      const st = S.companions[co.nom];
      const place = Object.entries(S.car.compagnons).find(([k]) => k === co.nom)[1];
      return `<div class="card">
        <div class="row"><h2 style="margin:0" class="grow">${co.nom}</h2>
          <span class="pill">${place ? 'Voiture place ' + place : 'hors voiture'}</span></div>
        <div class="statgrid" style="margin:8px 0">
          ${DATA.competences.map(k => `<div class="cell"><label>${capitalize(k)}</label><div style="font-weight:700">${co[k]}</div></div>`).join('')}
        </div>
        <label class="field">Mission en cours</label>
        <input type="text" data-mission="${co.nom}" value="${esc(st.mission)}" placeholder="Ex. : fouiller la pharmacie…">
        <div class="row wrap" style="margin-top:8px">
          ${DATA.competences.map(k => `<button class="btn sm" data-action="comp-test" data-name="${co.nom}" data-comp="${k}" data-val="${co[k]}">Test ${capitalize(k)} (≤${co[k]})</button>`).join('')}
        </div>
      </div>`;
    }).join('') + `<div class="muted">Test de compétence : 2d6 ≤ valeur = réussi. En combat de groupe, si réussi, l'adversaire subit la valeur de la compétence.</div>`;
  },
};
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ============================================================================
   ÉCRAN : CODES PROVISOIRES
   ========================================================================== */
ROUTES.codes = {
  title: 'Codes provisoires', sub: codesCount() + '/' + DATA.codes.length,
  html() {
    return `<div class="card">${DATA.codes.map(c => `<label class="item" style="cursor:pointer">
        <input type="checkbox" class="chk" data-code="${c}" ${S.codes[c] ? 'checked' : ''}>
        <div class="grow"><div class="name" style="letter-spacing:2px">${c}</div></div></label>`).join('')}</div>`;
  },
};

/* ============================================================================
   ÉCRAN : PARAGRAPHES COCHÉS
   ========================================================================== */
ROUTES.paragraphs = {
  title: 'Paragraphes cochés', sub: '',
  html() {
    const sorted = [...S.paragraphs].sort((a, b) => a - b);
    return `<div class="card">
        <label class="field">Ajouter un paragraphe</label>
        <div class="row"><input type="number" id="paraInput" inputmode="numeric" placeholder="N°" min="1">
          <button class="btn primary" data-action="para-add">Cocher</button></div>
      </div>
      <div class="card"><h2>${sorted.length} paragraphe(s)</h2>
        <div class="row wrap">${sorted.map(n => `<span class="pill" style="font-size:14px;padding:6px 10px">${n}
          <button data-action="para-del" data-n="${n}" style="background:none;border:0;color:var(--danger);font-size:15px">✕</button></span>`).join(' ') || '<span class="muted">Aucun.</span>'}</div>
      </div>`;
  },
};

/* ============================================================================
   ÉCRAN : PARAGRAPHES-OBJETS
   ========================================================================== */
ROUTES.paraObjets = {
  title: 'Paragraphes-objets', sub: 'récupérer des objets',
  html() {
    const nums = Object.keys(DATA.paragraphObjets).map(Number).sort((a, b) => a - b);
    const cur = ROUTES.paraObjets._cur;
    return `<div class="card">
        <label class="field">N° de paragraphe (${nums.join(', ')})</label>
        <div class="row"><input type="number" id="poInput" inputmode="numeric" placeholder="N°" value="${cur || ''}">
          <button class="btn primary" data-action="po-load">Afficher</button></div>
      </div>
      ${cur ? poListHtml(cur) : '<div class="muted">Entrez un numéro pour voir les objets proposés.</div>'}`;
  },
};
function poListHtml(num) {
  const items = DATA.paragraphObjets[num];
  if (!items) return '<div class="card"><div class="muted">Ce paragraphe ne propose pas d\'objets répertoriés.</div></div>';
  const checks = S.paraObjets[num] || (S.paraObjets[num] = items.map(() => false));
  return `<div class="card"><h2>Paragraphe ${num}</h2>
    <div class="muted" style="margin-bottom:8px">Cocher = ramasser (ajouté au sac / munitions).</div>
    ${items.map((it, i) => {
      let label, sub;
      if (it.ref.startsWith('mun:')) { const m = it.ref.slice(4); label = m + (it.qty ? ' ×' + it.qty : ''); sub = 'munition (0 place)'; }
      else { const o = DATA.itemById[it.ref]; label = itemName(it.ref); sub = (o.placeSac != null ? o.placeSac + ' place(s)' : '0 place') + (o.usage ? ' · ' + o.usage : o.type ? ' · ' + o.type : ''); }
      return `<label class="item" style="cursor:pointer"><input type="checkbox" class="chk" data-po="${num}" data-i="${i}" ${checks[i] ? 'checked' : ''}>
        <div class="grow"><div class="name">${esc(label)}</div><div class="meta">${esc(sub)}</div></div></label>`;
    }).join('')}
    <div class="muted">Sac : ${backpackUsed()}/${M.backpackMax} places.</div></div>`;
}
function togglePO(num, i, on) {
  const it = DATA.paragraphObjets[num][i];
  const q = it.qty || 1;
  if (it.ref.startsWith('mun:')) { const m = it.ref.slice(4); S.munitions[m] = Math.max(0, (S.munitions[m] || 0) + (on ? q : -q)); }
  else {
    if (on) { addToBackpack(it.ref, 1); if (backpackUsed() > M.backpackMax) toast('⚠ Sac en surcharge (' + backpackUsed() + '/' + M.backpackMax + ')'); }
    else addToBackpack(it.ref, -1);
  }
  S.paraObjets[num][i] = on;
  render();
}

/* ============================================================================
   ÉCRAN : FABRICATION
   ========================================================================== */
ROUTES.fabrication = {
  title: 'Fabrication', sub: 'calculateur + recettes',
  html() {
    const sel = ROUTES.fabrication._sel || {};   // { id: qty }
    // Composants possédés ayant une valeur numérique
    const comps = [];
    DATA.weapons.forEach(w => { if (typeof w.valeur === 'number' && ownedQty(w.id) > 0) comps.push(w); });
    DATA.craftItems.forEach(c => { if (ownedQty(c.id) > 0) comps.push(c); });
    let sum = 0; Object.entries(sel).forEach(([id, q]) => { sum += (DATA.itemById[id].valeur || 0) * q; });
    const nbSel = Object.values(sel).reduce((a, b) => a + b, 0);

    const fabricables = DATA.weapons.filter(w => w.fabNbObjets != null);
    return `
      <div class="card">
        <h2>Calculateur de fabrication</h2>
        <div class="muted">Additionnez la valeur des composants <b>possédés</b> → rendez-vous au paragraphe obtenu. Si c'est une fabrication, enregistrez la recette (armes & consommables détruits, outils conservés).</div>
        ${comps.length ? comps.map(w => {
          const q = sel[w.id] || 0, owned = ownedQty(w.id);
          return `<div class="item"><div class="grow"><div class="name">${esc(itemName(w.id))}</div>
            <div class="meta">valeur ${w.valeur} · possédé ×${owned} ${w.usage === 'outil' ? '<span class="pill tool">outil</span>' : ''}</div></div>
            <div class="stepper"><button data-action="fab-sel" data-id="${w.id}" data-delta="-1">−</button>
            <div class="val" style="min-width:36px">${q}</div>
            <button data-action="fab-sel" data-id="${w.id}" data-delta="1" data-max="${owned}">＋</button></div></div>`;
        }).join('') : '<div class="muted">Aucun composant valorisable en votre possession.</div>'}
        <div class="row" style="margin-top:10px">
          <div class="grow"><b>Total : ${sum}</b> ${nbSel ? '<span class="muted">(' + nbSel + ' composant·s)</span>' : ''}</div>
          ${sum > 0 ? `<span class="pill masked" style="font-size:15px">→ § ${sum}</span>` : ''}
        </div>
        ${nbSel ? `<div class="row wrap" style="margin-top:10px">
          <button class="btn sm" data-action="fab-make">✔ Cette combinaison fabrique un objet…</button>
          <button class="btn sm ghost" data-action="fab-reset">Réinitialiser</button></div>` : ''}
      </div>

      <div class="section-title">Objets fabricables</div>
      ${fabricables.map(w => {
        const rec = S.fabrication.recipes[w.id];
        return `<div class="card"><div class="row"><div class="grow">
            <div class="name">${esc(itemName(w.id))} ${w.masked ? '<span class="pill masked">masqué</span>' : ''}</div>
            <div class="meta">nécessite ${w.fabNbObjets} objet(s)${w.note ? ' · ' + esc(w.note) : ''}</div>
            ${rec ? '<div class="tag-ok" style="font-size:12px;margin-top:4px">Recette découverte : ' + rec.components.map(id => itemName(id)).join(' + ') + '</div>' : ''}
          </div>
          ${w.masked ? `<button class="btn sm" data-action="fab-rename" data-id="${w.id}">✎ Nommer</button>` : ''}
        </div></div>`;
      }).join('')}
      <div class="muted">Le renommage et les recettes sont effacés à chaque nouvelle partie.</div>`;
  },
};
function openFabMake() {
  const sel = ROUTES.fabrication._sel || {};
  const comps = Object.entries(sel).flatMap(([id, q]) => Array(q).fill(id));
  const fabricables = DATA.weapons.filter(w => w.fabNbObjets != null);
  const rows = fabricables.map(w => `<div class="item"><div class="grow"><div class="name">${esc(itemName(w.id))}</div>
      <div class="meta">nécessite ${w.fabNbObjets} · vous avez sélectionné ${comps.length}</div></div>
      <button class="btn sm primary" data-action="fab-produce" data-id="${w.id}">Fabriquer</button></div>`).join('');
  modal('Quel objet est fabriqué ?', `<div class="muted" style="margin-bottom:8px">Composants : ${comps.map(id => itemName(id)).join(' + ') || '—'}</div>${rows}`);
}
function fabProduce(prodId) {
  const w = DATA.itemById[prodId];
  const sel = ROUTES.fabrication._sel || {};
  const comps = Object.entries(sel).flatMap(([id, q]) => Array(q).fill(id));
  // Enregistre la recette (session)
  S.fabrication.recipes[prodId] = { components: comps.slice() };
  // Consomme : armes & consommables détruits, outils conservés
  Object.entries(sel).forEach(([id, q]) => {
    const it = DATA.itemById[id];
    if (it.usage === 'outil') return; // conservé
    for (let k = 0; k < q; k++) {
      if (S.backpack[id]) addToBackpack(id, -1);
      else if (S.car.coffre[id]) addToCoffre(id, -1);
    }
  });
  // Produit ajouté au coffre (fabrication dans le coffre de la voiture)
  addToCoffre(prodId, 1);
  ROUTES.fabrication._sel = {};
  closeModal();
  if (w.masked && !S.fabrication.renamed[prodId]) { render(); openRename(prodId); }
  else { toast(itemName(prodId) + ' fabriqué (ajouté au coffre)'); render(); }
}
function openRename(id) {
  const cur = S.fabrication.renamed[id] || '';
  modal('Nommer ' + DATA.itemById[id].name, `<label class="field">Nom réel découvert</label>
    <input type="text" id="renameInput" value="${esc(cur)}" placeholder="Ex. : Batte cloutée">
    <div class="row" style="margin-top:12px"><button class="btn primary full" data-action="rename-save" data-id="${id}">Enregistrer</button></div>`);
  setTimeout(() => { const el = $('#renameInput'); if (el) el.focus(); }, 50);
}

/* ============================================================================
   ÉCRAN : COMBAT (semi-auto)
   ========================================================================== */
ROUTES.combat = {
  title: 'Combat', sub: 'assistant d\'assaut',
  html() {
    const c = S.combat;
    if (!c) {
      const nums = [...new Set(DATA.adversaries.map(a => a.paragraphe))].sort((a, b) => a - b);
      return `<div class="card">
          <label class="field">N° de paragraphe du combat</label>
          <div class="row"><input type="number" id="combatInput" inputmode="numeric" placeholder="N°">
            <button class="btn primary" data-action="combat-load">Charger</button></div>
          <div class="muted" style="margin-top:8px">Répertoriés : ${nums.join(', ')}</div>
        </div>
        <div class="card"><div class="muted">Vous pouvez aussi créer un combat vierge si l'adversaire n'est pas listé.</div>
          <button class="btn full" data-action="combat-blank" style="margin-top:8px">Combat vierge</button></div>`;
    }
    return combatHtml(c);
  },
};
function loadCombat(num) {
  const found = DATA.adversaries.filter(a => a.paragraphe === num);
  const enemies = (found.length ? found : [{ nom: 'Adversaire', blessure: 20, habilete: 6, force: 6, cont: 1, tranch: 1, perf: 1, tir: 1, groupe: '' }])
    .map(a => ({ nom: a.nom, max: a.blessure || 20, dmg: 0, habilete: a.habilete || 6, force: a.force || 6,
      mult: { cont: a.cont || 1, tranch: a.tranch || 1, perf: a.perf || 1, tir: a.tir || 1 }, groupe: a.groupe || '' }));
  S.combat = { paragraphe: num, enemies, target: 0, log: [] };
  render();
}
function combatHtml(c) {
  const heroB = S.hero.blessures;
  const equipped = SLOTS.map(([k]) => S.hero[k]).filter(Boolean).map(s => s.itemId);
  const weaponsAvail = equipped.length ? equipped : ['mainsnues'];
  return `
    <div class="card">
      <div class="row"><h2 class="grow" style="margin:0">Paragraphe ${c.paragraphe}</h2>
        <button class="btn sm danger" data-action="combat-end">Terminer</button></div>
    </div>

    <div class="card">
      <div class="row"><div class="grow"><b>Héros</b> — blessures</div>
        <div class="stepper"><button data-action="step" data-path="hero.blessures" data-delta="-1" data-min="0">−</button>
          <div class="val" style="min-width:44px">${heroB}<span class="max">/${M.heroBlessuresMax}</span></div>
          <button data-action="step" data-path="hero.blessures" data-delta="1" data-max="${M.heroBlessuresMax}">＋</button></div>
      </div>
      ${heroB >= M.heroBlessuresMax ? '<div class="tag-danger" style="margin-top:6px">☠ Le héros est mort.</div>' : ''}
    </div>

    ${c.enemies.map((e, i) => enemyHtml(e, i, c.target === i)).join('')}

    <div class="card">
      <h3>Assaut — arme du héros</h3>
      <select id="combatWeapon" class="grow" style="margin-bottom:8px">
        ${weaponsAvail.map(id => `<option value="${id}">${esc(itemName(id))}</option>`).join('')}
      </select>
      <div class="row wrap">
        <button class="btn sm" data-action="assault" data-type="cont">Frapper (contondant)</button>
        <button class="btn sm" data-action="assault" data-type="tranch">Frapper (tranchant)</button>
        <button class="btn sm" data-action="assault" data-type="perf">Frapper (perforant)</button>
        <button class="btn sm primary" data-action="assault" data-type="tir">Tir</button>
      </div>
      <div class="muted" style="margin-top:6px">2d6 ≥ Habileté ennemi = touché (dégâts selon le type × multiplicateur). Sinon le héros subit la Force. Cible : ${esc(c.enemies[c.target] ? c.enemies[c.target].nom : '—')}.</div>
    </div>

    ${companionsPresent().length ? `<div class="card"><h3>Attaque des compagnons (combat de groupe)</h3>
      ${companionsPresent().map(co => `<div class="row wrap" style="margin-bottom:6px"><span class="pill">${co.nom}</span>
        ${DATA.competences.map(k => `<button class="btn sm" data-action="comp-attack" data-name="${co.nom}" data-comp="${k}" data-val="${co[k]}">${capitalize(k)} ≤${co[k]}</button>`).join('')}</div>`).join('')}
      <div class="muted">2d6 ≤ compétence : l'adversaire ciblé subit la valeur de la compétence.</div></div>` : ''}

    <div class="card"><h3>Journal</h3>
      <div class="combat-log">${c.log.length ? c.log.map(l => `<div class="line ${l.cls || ''}">${esc(l.t)}</div>`).join('') : '<div class="muted">—</div>'}</div>
    </div>`;
}
function enemyHtml(e, i, isTarget) {
  const dead = e.dmg >= e.max;
  return `<div class="enemy" style="${isTarget ? 'box-shadow:0 0 0 2px var(--accent2)' : ''}">
    <div class="row"><h3 class="grow" style="margin:0">${esc(e.nom)} ${dead ? '<span class="tag-danger">☠ mort</span>' : ''}</h3>
      <button class="btn sm ${isTarget ? 'primary' : ''}" data-action="target" data-i="${i}">${isTarget ? '● Cible' : 'Cibler'}</button></div>
    <div class="row" style="margin:8px 0"><div class="grow">Blessures subies</div>
      <div class="stepper"><button data-action="enemy-dmg" data-i="${i}" data-delta="-1">−</button>
        <div class="val" style="min-width:52px">${e.dmg}<span class="max">/${e.max}</span></div>
        <button data-action="enemy-dmg" data-i="${i}" data-delta="1">＋</button></div></div>
    <div class="bar ${dead ? 'danger' : ''}"><span style="width:${Math.min(100, e.dmg / e.max * 100)}%"></span></div>
    <div class="statgrid" style="margin-top:8px">
      ${[['max', 'Blessures max'], ['habilete', 'Habileté'], ['force', 'Force']].map(([k, lbl]) =>
        `<div class="cell"><label>${lbl}</label><input type="number" data-enemy="${i}" data-field="${k}" value="${e[k]}"></div>`).join('')}
      <div class="cell"><label>Multiplicateurs</label><div style="font-size:12px">C×${e.mult.cont} T×${e.mult.tranch} P×${e.mult.perf} Tir×${e.mult.tir}</div></div>
    </div>
    ${e.groupe ? `<div class="muted" style="margin-top:6px">Combat de groupe : compétence <b>${esc(e.groupe)}</b>.</div>` : ''}
  </div>`;
}
function companionsPresent() {
  // compagnons dans la voiture et sans mission = disponibles pour le combat de groupe
  return DATA.companions.filter(co => S.car.compagnons[co.nom] && !S.companions[co.nom].mission);
}

function assault(weaponId, type) {
  const c = S.combat; if (!c) return;
  const e = c.enemies[c.target]; if (!e) { toast('Choisissez une cible.'); return; }
  if (e.dmg >= e.max) { toast('Cet adversaire est déjà mort.'); return; }
  const w = DATA.itemById[weaponId];
  const r1 = d6(), r2 = d6(), sum = r1 + r2;
  showDice(r1, r2);
  let line;
  if (sum >= e.habilete) {
    let dmg = 0, extra = '';
    if (type === 'tir') {
      const tir = parseTir(w.tir);
      if (!tir) { toast('Cette arme ne tire pas.'); return; }
      if (w.munition) {
        const avail = S.munitions[w.munition] || 0;
        const used = Math.min(tir.canons, avail);
        if (used <= 0) { toast('Plus de ' + w.munition + '.'); return; }
        dmg = tir.base * used * e.mult.tir;
        S.munitions[w.munition] = avail - used;
        extra = ' [' + used + ' ' + w.munition + ']';
      } else { dmg = tir.base * tir.canons * e.mult.tir; }
    } else {
      const base = meleeVal(w, type, weaponId);
      if (base == null) { toast('Pas de dégâts ' + type + ' pour cette arme.'); return; }
      dmg = base * e.mult[type];
      // Durabilité +1 (corps à corps)
      const slot = SLOTS.map(([k]) => k).find(k => S.hero[k] && S.hero[k].itemId === weaponId);
      if (slot && w.durabilite !== 'infinie') {
        S.hero[slot].durabilityUsed = (S.hero[slot].durabilityUsed || 0) + 1;
        if (S.hero[slot].durabilityUsed > w.durabilite) { extra = ' — ⚠ ' + itemName(weaponId) + ' brisée !'; S.hero[slot] = null; }
      }
    }
    e.dmg = Math.min(e.max, e.dmg + dmg);
    line = { t: `🎲 ${r1}+${r2}=${sum} ≥ ${e.habilete} → ${e.nom} subit ${dmg} (${type})${extra}`, cls: 'hit' };
    if (e.dmg >= e.max) line.t += ' ☠';
  } else {
    S.hero.blessures = Math.min(M.heroBlessuresMax, S.hero.blessures + e.force);
    line = { t: `🎲 ${r1}+${r2}=${sum} < ${e.habilete} → le héros subit ${e.force} (Force de ${e.nom})`, cls: 'miss' };
    if (S.hero.blessures >= M.heroBlessuresMax) line.t += ' ☠';
  }
  c.log.unshift(line);
  render();
}
function meleeVal(w, type, id) {
  let v = w[type];
  if (v == null) return null;
  if (typeof v === 'object') {
    // arme 1ou2 : mode selon l'emplacement occupé
    const inTwo = S.hero.deuxMains && S.hero.deuxMains.itemId === id;
    return inTwo ? v.deux : v.un;
  }
  return v;
}
function parseTir(tir) {
  if (!tir || tir === 0) return null;
  const s = String(tir);
  if (s.includes('x')) { const [b, c] = s.split('x'); return { base: +b, canons: +c }; }
  return { base: +s, canons: 1 };
}
function compAttack(name, comp, val) {
  const c = S.combat; if (!c) return;
  const e = c.enemies[c.target]; if (!e) { toast('Choisissez une cible.'); return; }
  const r1 = d6(), r2 = d6(), sum = r1 + r2; showDice(r1, r2);
  let line;
  if (sum <= val) { e.dmg = Math.min(e.max, e.dmg + val); line = { t: `👥 ${name} ${capitalize(comp)} : ${r1}+${r2}=${sum} ≤ ${val} → ${e.nom} subit ${val}`, cls: 'hit' }; }
  else line = { t: `👥 ${name} ${capitalize(comp)} : ${r1}+${r2}=${sum} > ${val} → raté`, cls: 'miss' };
  c.log.unshift(line); render();
}

/* ============================================================================
   ÉCRANS RÉFÉRENCE (lecture seule)
   ========================================================================== */
ROUTES.abecedaire = {
  title: 'Abécédaire des objets', sub: 'lecture seule',
  html() {
    return `<div class="tablewrap"><table><thead><tr>
      <th>Objet</th><th>Mode</th><th>Type</th><th>Sac</th><th>Mun.</th><th>Cont.</th><th>Tranch.</th><th>Perf.</th><th>Tir</th><th>Dur.</th><th>Fab.</th></tr></thead><tbody>
      ${DATA.weapons.map(w => `<tr><td>${esc(itemName(w.id))}</td><td>${w.mode || '—'}</td><td>${esc(w.type)}</td>
        <td>${w.placeSac == null ? '—' : w.placeSac}</td><td>${w.munition || '—'}</td>
        <td>${fmtDmg(w.cont)}</td><td>${fmtDmg(w.tranch)}</td><td>${fmtDmg(w.perf)}</td><td>${w.tir || '—'}</td>
        <td>${w.durabilite}</td><td>${w.fabNbObjets ? w.fabNbObjets + ' obj.' : '—'}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="muted" style="margin-top:8px">Les notes complètes figurent dans les écrans Fabrication / Combat.</div>`;
  },
};
function fmtDmg(v) { if (v == null) return '—'; if (typeof v === 'object') return v.un + '/' + v.deux; return v; }

ROUTES.craftref = {
  title: 'Objets pour fabrication', sub: 'lecture seule',
  html() {
    return `<div class="tablewrap"><table><thead><tr><th>Objet</th><th>Usage</th><th>Place sac</th><th>Valeur</th></tr></thead><tbody>
      ${DATA.craftItems.map(c => `<tr><td>${esc(c.name)}</td><td>${c.usage}</td><td>${c.placeSac}</td><td>${c.valeur}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="muted" style="margin-top:8px">Valeur = utilisée pour le calcul de fabrication (somme → n° de paragraphe). Outils conservés, consommables détruits.</div>`;
  },
};

ROUTES.rules = {
  title: 'Rappel des règles', sub: '',
  html() { return RULES_HTML; },
};

/* ============================================================================
   MODALE
   ========================================================================== */
function modal(title, bodyHtml) {
  closeModal();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modalBg';
  bg.innerHTML = `<div class="modal"><div class="row"><h3 class="grow">${esc(title)}</h3>
    <button class="btn sm ghost" data-action="close-modal">Fermer</button></div>${bodyHtml}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
}
function closeModal() { const m = $('#modalBg'); if (m) m.remove(); }

/* ============================================================================
   ÉVÉNEMENTS (délégation)
   ========================================================================== */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-route],[data-action]');
  if (!t) return;
  if (t.dataset.route) { route(t.dataset.route); return; }
  const a = t.dataset.action;
  const H = ACTIONS[a];
  if (H) { e.preventDefault(); H(t); }
});

const ACTIONS = {
  'close-modal': closeModal,
  'session-num': () => { const n = prompt('Numéro de session ?', S.numero); if (n && !isNaN(+n)) { S.numero = +n; render(); } },
  'new-session': () => { if (confirm('Démarrer une NOUVELLE partie ? La session en cours sera effacée (renommages et recettes compris).')) { const keep = S.numero; S = defaultSession(); S.numero = keep + 1; stack = ['home']; render(); toast('Nouvelle partie — session ' + S.numero); } },
  'step': t => { const p = t.dataset.path, delta = +t.dataset.delta; let v = getPath(p) + delta;
    if (t.dataset.min != null) v = Math.max(+t.dataset.min, v); if (t.dataset.max != null) v = Math.min(+t.dataset.max, v);
    setPath(p, v); render(); },
  'heal10': () => { S.hero.blessures = Math.max(0, S.hero.blessures - 10); toast('−10 blessures'); render(); },
  'equip': t => openEquip(t.dataset.slot),
  'equip-pick': t => doEquip(t.dataset.slot, t.dataset.id),
  'unequip': t => unequip(t.dataset.slot),
  'bp': t => { addToBackpack(t.dataset.id, +t.dataset.delta); render(); },
  'bp-add': t => { addToBackpack(t.dataset.id, 1); toast(itemName(t.dataset.id) + ' ajouté'); if (backpackUsed() > M.backpackMax) toast('⚠ Sac en surcharge'); render(); },
  'add-item': openAddItem,
  'coffre': t => { addToCoffre(t.dataset.id, +t.dataset.delta); render(); },
  'coffre-add': t => { addToCoffre(t.dataset.id, 1); toast(itemName(t.dataset.id) + ' au coffre'); render(); },
  'add-coffre': openAddCoffre,
  'list-add': t => { const f = t.dataset.field, inp = document.querySelector(`[data-listinput="${f}"]`); const v = inp.value.trim(); if (v) { S[f].push(v); render(); } },
  'list-del': t => { S[t.dataset.field].splice(+t.dataset.i, 1); render(); },
  'para-add': () => { const inp = $('#paraInput'); const n = +inp.value; if (n && !S.paragraphs.includes(n)) { S.paragraphs.push(n); render(); } else if (n) toast('Déjà coché.'); },
  'para-del': t => { S.paragraphs = S.paragraphs.filter(x => x !== +t.dataset.n); render(); },
  'po-load': () => { const n = +$('#poInput').value; ROUTES.paraObjets._cur = n || null; render(); },
  'comp-test': t => { const r1 = d6(), r2 = d6(), s = r1 + r2, v = +t.dataset.val; showDice(r1, r2); toast(`${t.dataset.name} · ${capitalize(t.dataset.comp)} : ${r1}+${r2}=${s} ${s <= v ? '✔ réussi' : '✗ raté'} (≤${v})`); },
  'fab-sel': t => { const sel = ROUTES.fabrication._sel || (ROUTES.fabrication._sel = {}); const id = t.dataset.id; let q = (sel[id] || 0) + (+t.dataset.delta);
    const max = t.dataset.max != null ? +t.dataset.max : Infinity; q = Math.max(0, Math.min(max, q)); if (q) sel[id] = q; else delete sel[id]; render(); },
  'fab-reset': () => { ROUTES.fabrication._sel = {}; render(); },
  'fab-make': openFabMake,
  'fab-produce': t => fabProduce(t.dataset.id),
  'fab-rename': t => openRename(t.dataset.id),
  'rename-save': t => { const v = $('#renameInput').value.trim(); if (v) S.fabrication.renamed[t.dataset.id] = v; else delete S.fabrication.renamed[t.dataset.id]; closeModal(); toast('Nom enregistré'); render(); },
  'combat-load': () => { const n = +$('#combatInput').value; if (n) loadCombat(n); },
  'combat-blank': () => loadCombat(0),
  'combat-end': () => { if (confirm('Terminer ce combat ? (le journal sera perdu)')) { S.combat = null; render(); } },
  'target': t => { S.combat.target = +t.dataset.i; render(); },
  'enemy-dmg': t => { const e = S.combat.enemies[+t.dataset.i]; e.dmg = Math.max(0, Math.min(e.max, e.dmg + (+t.dataset.delta))); render(); },
  'assault': t => { const wid = $('#combatWeapon').value; assault(wid, t.dataset.type); },
  'comp-attack': t => compAttack(t.dataset.name, t.dataset.comp, +t.dataset.val),
};

/* Champs de saisie (délégation change/input) */
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.code) { S.codes[el.dataset.code] = el.checked; render(); }
  else if (el.dataset.po != null) { togglePO(+el.dataset.po, +el.dataset.i, el.checked); }
  else if (el.dataset.carslot) {
    const n = +el.dataset.carslot, name = el.value;
    Object.keys(S.car.compagnons).forEach(k => { if (S.car.compagnons[k] === n) S.car.compagnons[k] = null; });
    if (name) S.car.compagnons[name] = n;
    render();
  }
  else if (el.dataset.mission != null) { S.companions[el.dataset.mission].mission = el.value; save(); }
  else if (el.dataset.enemy != null) { const en = S.combat.enemies[+el.dataset.enemy]; en[el.dataset.field] = Math.max(0, +el.value || 0); save(); }
});

/* ============================================================================
   DÉS (barre du haut)
   ========================================================================== */
function showDice(r1, r2) {
  $('#d1').textContent = r1; $('#d2').textContent = r2; $('#dsum').textContent = '= ' + (r1 + r2);
}
$('#btnDice').addEventListener('click', () => { const r1 = d6(), r2 = d6(); showDice(r1, r2); });
$('#btnBack').addEventListener('click', back);
$('#navHome').addEventListener('click', () => { stack = ['home']; render(); });
$('#navHero').addEventListener('click', () => route('hero'));
$('#navBackpack').addEventListener('click', () => route('backpack'));
$('#navCombat').addEventListener('click', () => route('combat'));

/* ============================================================================
   TEXTE DES RÈGLES (rappel_de_règles.md)
   ========================================================================== */
const RULES_HTML = `
<div class="card"><h3>Combat</h3><ul class="muted">
<li>Les adversaires ont des caractéristiques de base, révélées au fil du combat.</li>
<li>À chaque assaut, choisissez la Main (l'arme). Une arme à 2 mains ne laisse pas le choix.</li>
<li>Lancez 2 dés. Score ≥ Habileté de l'ennemi → vous infligez des Blessures.</li>
<li>Blessures selon le type de l'arme (Contondant, Tranchant, Estoc/Perforant ou Tir).</li>
<li>Score &lt; Habileté → l'ennemi vous touche : vous subissez sa Force en Blessures.</li>
<li>Le premier combattant à atteindre son maximum de Points de Blessures meurt.</li></ul></div>
<div class="card"><h3>Combat de groupe</h3><ul class="muted">
<li>Vous êtes toujours la cible : combattez normalement.</li>
<li>Les compagnons utilisent une Compétence indiquée. Ils attaquent à tour de rôle (2d6).</li>
<li>Somme ≤ Compétence demandée → l'adversaire subit un nombre égal à la compétence du compagnon.</li></ul></div>
<div class="card"><h3>Armes</h3><ul class="muted">
<li>Deux armes à 1 Main, ou 1 arme à 2 Mains. Possibilité de ranger 1 arme à 1 Main à la ceinture (secours).</li>
<li>Armes en main et à la ceinture ne comptent pas dans le sac.</li>
<li>Armes à feu : Tir avec multiple (ex. 20×2). Cartouches nécessaires ; dégâts proportionnels aux munitions.</li>
<li>Durabilité : +1 par coup au corps à corps. Dépassement → l'arme se brise.</li></ul></div>
<div class="card"><h3>Fabrication</h3><ul class="muted">
<li>Construction dans le coffre de la voiture. Additionnez les valeurs des composants → paragraphe indiqué.</li>
<li>Si fabrication : notez les composants. Armes & consommables détruits, outils conservés.</li>
<li>Les paragraphes avec * permettent de souffler, utiliser un Kit médical ou changer d'armes.</li></ul></div>
<div class="card"><h3>Voiture</h3><ul class="muted">
<li>Coffre illimité. Kits médicaux (−10 blessures) et coffre utilisables à l'arrêt devant la voiture.</li>
<li>À 30 Points de Dégâts ou sans essence → paragraphe 200.</li></ul></div>
<div class="card"><h3>Missions & Compétences</h3><ul class="muted">
<li>Envoyez vos camarades en mission. Au retour, effectuez des Tests de Compétences.</li>
<li>Test réussi → vous obtenez les récompenses des tests réussis ET ratés. (voir §83)</li></ul></div>`;

/* ---------- Démarrage ---------------------------------------------------- */
render();

/* ---------- Service worker (PWA) ----------------------------------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

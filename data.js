/* ============================================================================
   Le Livre des Morts — base de données du jeu
   Transcrite depuis les fichiers .md de _inbox/livre_des_morts (19/07/2026)
   Les "Objet#X" sont masqués volontairement (spoilers) : name = affiché,
   realName = renommable en cours de partie (remis à zéro chaque session).
   ========================================================================== */

const DATA = {

  meta: {
    heroBlessuresMax: 30,
    carDegatsMax: 30,
    carEssenceMax: 68,
    backpackMax: 10,
    carCompagnonSlots: 3,
    paragrapheGameOver: 200,
  },

  /* --- Compagnons (liste_des_compagnons.md) ------------------------------- */
  companions: [
    { nom: 'Terry',  habilete: 9, tir: 8,  observation: 7, piratage: 9,  erudition: 7,  reparation: 12 },
    { nom: 'Sergio', habilete: 8, tir: 10, observation: 6, piratage: 10, erudition: 9,  reparation: 7  },
    { nom: 'Carole', habilete: 7, tir: 7,  observation: 8, piratage: 10, erudition: 12, reparation: 5  },
  ],
  competences: ['habilete', 'tir', 'observation', 'piratage', 'erudition', 'reparation'],

  /* --- Codes provisoires (codes_provisoires.md) --------------------------- */
  codes: ['BANG', 'CLIC', 'PAF', 'RAS', 'TOC', 'VLAN', 'VUE', 'ZAP'],

  /* --- Abécédaire des armes / objets (abecedaire_objets.md) --------------- *
     placeSac : nb d'emplacements dans le sac à dos (null = ne se range pas)
     valeur   : pour le calcul de fabrication (null = aucune)
     cont/tranch/perf : nombre, ou {un:x, deux:y} si le mode change les dégâts
     tir      : "20x2" (multiplicateur), 0, ou null
     durabilite : nombre ou "infinie"
     fabNbObjets : nb de composants requis (null = non fabricable)
     masked   : true = nom caché (Objet#X), renommable en jeu                 */
  weapons: [
    { id: 'baton', name: 'Bâton', masked: false, mode: '1ou2', type: 'Corps-à-corps',
      placeSac: 4, munition: null, valeur: null,
      cont: { un: 4, deux: 6 }, tranch: 1, perf: { un: 2, deux: 3 }, tir: 0,
      durabilite: 4, fabNbObjets: null, note: '' },

    { id: 'objet2', name: 'Objet#2', masked: true, mode: '1ou2', type: 'Corps-à-corps',
      placeSac: 4, munition: null, valeur: null,
      cont: { un: 8, deux: 11 }, tranch: { un: 4, deux: 6 }, perf: { un: 7, deux: 9 }, tir: 0,
      durabilite: 5, fabNbObjets: 3, note: '' },

    { id: 'objet3', name: 'Objet#3', masked: true, mode: '1main', type: 'Explosif',
      placeSac: 2, munition: null, valeur: null,
      cont: null, tranch: null, perf: null, tir: null,
      durabilite: 1, fabNbObjets: 2, note: 'Provoque des explosions. Non utilisable au combat' },

    { id: 'couteau', name: 'Couteau', masked: false, mode: '1main', type: 'Corps-à-corps',
      placeSac: 1, munition: null, valeur: 44,
      cont: 3, tranch: 5, perf: 5, tir: 0,
      durabilite: 8, fabNbObjets: null,
      note: 'Vous décidez à chaque tour si vous infligez des Blessures tranchantes ou d\'estoc' },

    { id: 'objet5', name: 'Objet#5', masked: true, mode: '', type: 'Corps-à-corps',
      placeSac: 0, munition: null, valeur: null,
      cont: null, tranch: null, perf: null, tir: null,
      durabilite: 'infinie', fabNbObjets: 2,
      note: 'Augmente toutes les caractéristiques Mains nues de +1. Ne peut pas se briser' },

    { id: 'fusil2canons', name: 'Fusil à double canon', masked: false, mode: '2mains', type: 'Arme à feu',
      placeSac: 4, munition: 'Cartouche', valeur: 165,
      cont: 4, tranch: 1, perf: 2, tir: '20x2',
      durabilite: 7, fabNbObjets: null, note: 'Inflige 20 Blessures par cartouche. 1 cartouche par canon' },

    { id: 'objet7', name: 'Objet#7', masked: true, mode: '1main', type: 'Arme à feu',
      placeSac: 3, munition: 'Cartouche', valeur: null,
      cont: 3, tranch: 1, perf: 2, tir: '15x2',
      durabilite: 7, fabNbObjets: 2, note: 'Inflige 15 Blessures par cartouche. 1 cartouche par canon' },

    { id: 'kitmedical', name: 'Kit médical', masked: false, mode: '', type: 'Soin',
      placeSac: 3, munition: null, valeur: null,
      cont: 0, tranch: 0, perf: 0, tir: 0,
      durabilite: 1, fabNbObjets: 3, note: 'Guérit 10 Blessures' },

    { id: 'lampe', name: 'Lampe de poche', masked: false, mode: '1main', type: 'Objet',
      placeSac: null, munition: null, valeur: null,
      cont: 0, tranch: 0, perf: 0, tir: 0,
      durabilite: 'infinie', fabNbObjets: null, note: 'Permet de voir dans l\'obscurité. Dingue, non ?' },

    { id: 'objet10', name: 'Objet#10', masked: true, mode: '2mains', type: 'Corps-à-corps',
      placeSac: 4, munition: null, valeur: null,
      cont: 6, tranch: 7, perf: 10, tir: 0,
      durabilite: 8, fabNbObjets: 3, note: '' },

    { id: 'mainsnues', name: 'Mains Nues', masked: false, mode: '', type: '',
      placeSac: 0, munition: null, valeur: null,
      cont: 1, tranch: 1, perf: 1, tir: 0,
      durabilite: 'infinie', fabNbObjets: null, note: '' },

    { id: 'objet12', name: 'Objet#12', masked: true, mode: '2mains', type: 'Arme à feu',
      placeSac: 6, munition: 'Cartouche', valeur: 291,
      cont: 4, tranch: 1, perf: 2, tir: '20x4',
      durabilite: 5, fabNbObjets: 2, note: 'Inflige 20 Blessures par cartouche' },

    { id: 'objet13', name: 'Objet#13', masked: true, mode: '1main', type: 'Arme à feu',
      placeSac: 5, munition: 'Cartouche', valeur: null,
      cont: 3, tranch: 1, perf: 2, tir: '15x4',
      durabilite: 6, fabNbObjets: 2, note: 'Inflige 15 Blessures par cartouche' },

    { id: 'pelle', name: 'Pelle', masked: false, mode: '2mains', type: 'Corps-à-corps',
      placeSac: 8, munition: null, valeur: null,
      cont: 8, tranch: 7, perf: 3, tir: 0,
      durabilite: 10, fabNbObjets: null,
      note: 'Si votre lancer de dés est ≥9, vous pouvez infliger des Blessures de type tranchant au lieu de contondant' },

    { id: 'pistolet', name: 'Pistolet', masked: false, mode: '1main', type: 'Arme à feu',
      placeSac: 2, munition: 'Balle', valeur: 208,
      cont: 2, tranch: 1, perf: 1, tir: '10',
      durabilite: 6, fabNbObjets: null, note: '' },

    { id: 'objet16', name: 'Objet#16', masked: true, mode: '1main', type: 'Arme à feu',
      placeSac: 3, munition: 'Balle', valeur: null,
      cont: 3, tranch: 4, perf: 4, tir: '10',
      durabilite: 7, fabNbObjets: 3, note: '' },
  ],

  /* --- Objets pour fabrication (objets_pour_fabrication.md) ---------------- *
     usage : 'consommable' | 'outil'  (détruit à la fabrication sauf outil)    */
  craftItems: [
    { id: 'alcool',  name: 'Alcool',        usage: 'consommable', placeSac: 2,  valeur: 125 },
    { id: 'bidon',   name: 'Bidon',         usage: 'outil',       placeSac: 10, valeur: 0   },
    { id: 'chiffon', name: 'Chiffon',       usage: 'consommable', placeSac: 1,  valeur: 145 },
    { id: 'clous',   name: 'Clous',         usage: 'consommable', placeSac: 1,  valeur: 107 },
    { id: 'gants',   name: 'Gants',         usage: 'consommable', placeSac: 1,  valeur: 15  },
    { id: 'marteau', name: 'Marteau',       usage: 'outil',       placeSac: 2,  valeur: 85  },
    { id: 'ruban',   name: 'Ruban adhésif', usage: 'consommable', placeSac: 2,  valeur: 63  },
    { id: 'scie',    name: 'Scie',          usage: 'outil',       placeSac: 3,  valeur: 30  },
  ],

  /* --- Munitions (occupent 0 place) --------------------------------------- */
  munitionTypes: ['Cartouche', 'Balle'],

  /* --- Adversaires (liste_adversaires.md), groupés par paragraphe ---------- */
  adversaries: [
    { paragraphe: 16,  nom: 'Pestigénéré', blessure: 21, habilete: 6, force: 7, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 48,  nom: 'Pestigénéré sur la route', blessure: 24, habilete: 5, force: 9, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 80,  nom: 'Sacrolithe sur la route', blessure: 19, habilete: 6, force: 9, rapidite: null, cont: 1, tranch: 1, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 86,  nom: 'Sacrolithe de la cave', blessure: 22, habilete: 6, force: 7, rapidite: null, cont: 1, tranch: 1, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 86,  nom: 'Pestigénéré de la cave', blessure: 27, habilete: 7, force: 6, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 103, nom: 'Monstre de la grange', blessure: 20, habilete: 6, force: 7, rapidite: null, cont: 1, tranch: 2, perf: null, tir: null, groupe: '' },
    { paragraphe: 112, nom: 'Tueur de Safran', blessure: 41, habilete: 10, force: 11, rapidite: null, cont: 3, tranch: 1, perf: 1, tir: 1, groupe: 'Tir' },
    { paragraphe: 114, nom: 'Etre à capuche', blessure: 24, habilete: 6, force: 7, rapidite: null, cont: 1, tranch: 1, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 116, nom: 'Patrouilleur de la bibliothèque', blessure: 23, habilete: 6, force: 11, rapidite: null, cont: 3, tranch: 1, perf: 1, tir: 1, groupe: '' },
    { paragraphe: 134, nom: 'Abomination de la pharmacie', blessure: 17, habilete: 8, force: 7, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 227, nom: 'John', blessure: 16, habilete: 6, force: 7, rapidite: null, cont: 2, tranch: 2, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 273, nom: 'Patrouilleur', blessure: 15, habilete: 9, force: 9, rapidite: null, cont: 3, tranch: 1, perf: 1, tir: 1, groupe: '' },
    { paragraphe: 282, nom: 'Pervers pestigénéré', blessure: 40, habilete: 7, force: 7, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 299, nom: 'Sacrolithe de la caserne', blessure: 24, habilete: 7, force: 8, rapidite: null, cont: 1, tranch: 1, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 303, nom: 'Patrouilleur parlant', blessure: 13, habilete: 6, force: 10, rapidite: null, cont: 3, tranch: 1, perf: 1, tir: 1, groupe: '' },
    { paragraphe: 305, nom: 'Pestigénéré de l\'autoroute', blessure: 15, habilete: 6, force: 7, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 305, nom: 'Sacrolithe de l\'autoroute', blessure: 14, habilete: 5, force: 9, rapidite: null, cont: 1, tranch: 1, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 330, nom: 'Janus Novak et Lavande', blessure: 50, habilete: 9, force: 9, rapidite: null, cont: 2, tranch: 2, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 359, nom: 'Gordianoth', blessure: 80, habilete: 7, force: 7, rapidite: null, cont: 2, tranch: 2, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 375, nom: 'Lavande', blessure: 30, habilete: 7, force: 9, rapidite: null, cont: 2, tranch: 2, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 403, nom: 'Sacrolithe Gardien', blessure: 16, habilete: 6, force: 8, rapidite: null, cont: 1, tranch: 1, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 429, nom: 'Janus Novak', blessure: 20, habilete: 3, force: 4, rapidite: null, cont: 2, tranch: 2, perf: 2, tir: 2, groupe: '' },
    { paragraphe: 434, nom: 'Pestigénéré sur le côté', blessure: 21, habilete: 6, force: 7, rapidite: null, cont: 1, tranch: 2, perf: 1, tir: 2, groupe: '' },
    { paragraphe: 457, nom: 'Horde du Port', blessure: 60, habilete: null, force: null, rapidite: null, cont: null, tranch: null, perf: null, tir: null, groupe: '' },
    { paragraphe: 473, nom: 'Gordianoth', blessure: 40, habilete: 7, force: 7, rapidite: null, cont: 2, tranch: 2, perf: 2, tir: 2, groupe: '' },
  ],

  /* --- Paragraphes proposant des objets (paragraphes_objets.md) ----------- *
     Chaque objet référence un id de weapons/craftItems, ou une munition.     */
  paragraphObjets: {
    8:   [{ ref: 'alcool' }, { ref: 'alcool' }, { ref: 'ruban' }],
    16:  [{ ref: 'alcool' }, { ref: 'baton' }, { ref: 'clous' }, { ref: 'marteau' }, { ref: 'ruban' }],
    36:  [{ ref: 'alcool' }, { ref: 'chiffon' }, { ref: 'chiffon' }, { ref: 'clous' }, { ref: 'couteau' }, { ref: 'lampe' }, { ref: 'marteau' }, { ref: 'ruban' }],
    89:  [{ ref: 'alcool' }, { ref: 'chiffon' }, { ref: 'gants' }, { ref: 'ruban' }],
    99:  [{ ref: 'alcool' }, { ref: 'baton' }, { ref: 'chiffon' }, { ref: 'chiffon' }, { ref: 'scie' }, { ref: 'ruban' }],
    108: [{ ref: 'alcool' }, { ref: 'baton' }, { ref: 'chiffon' }, { ref: 'clous' }, { ref: 'fusil2canons' }, { ref: 'ruban' }],
    187: [{ ref: 'mun:Balle', qty: 5 }, { ref: 'mun:Cartouche', qty: 3 }, { ref: 'couteau' }, { ref: 'fusil2canons' }, { ref: 'pistolet' }],
    218: [{ ref: 'alcool' }, { ref: 'baton' }, { ref: 'mun:Balle', qty: 12 }, { ref: 'pistolet' }, { ref: 'ruban' }],
    334: [{ ref: 'fusil2canons' }, { ref: 'mun:Cartouche', qty: 4 }],
    386: [{ ref: 'alcool' }, { ref: 'chiffon' }, { ref: 'chiffon' }, { ref: 'clous' }, { ref: 'couteau' }],
  },
};

/* Index de recherche rapide par id (armes + objets de fabrication) */
DATA.itemById = {};
DATA.weapons.forEach(w => { DATA.itemById[w.id] = { ...w, kind: 'weapon' }; });
DATA.craftItems.forEach(c => { DATA.itemById[c.id] = { ...c, kind: 'craft' }; });

if (typeof module !== 'undefined') { module.exports = DATA; }

# Le Livre des Morts — compagnon de jeu (PWA)

Application web installable pour jouer au livre-jeu **« Le Livre des Morts »** (Makaka).
Fonctionne hors-ligne, sauvegarde la partie en cours automatiquement (localStorage).
Aucune installation d'outil sur le PC, aucun droit administrateur requis.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | page unique de l'app |
| `style.css` | thème sombre, mobile-first |
| `data.js` | base de données du jeu (armes, adversaires, compagnons, paragraphes…) |
| `app.js` | logique (état de partie, combat, sac, fabrication…) |
| `manifest.webmanifest` + `sw.js` | installation PWA + hors-ligne |
| `icon.svg` / `icon-192.png` / `icon-512.png` | icônes |

## Modules

Accueil → Combat · Héros · Sac à dos · Voiture · Compagnons · Codes provisoires ·
Paragraphes cochés · Paragraphes-objets · Fabrication · Abécédaire · Objets de
fabrication · Rappel des règles. Lanceur **2d6** et n° de session toujours visibles en haut.

## Tester en local (sur le PC)

Dans le dossier de l'app :

```
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000/` dans un navigateur.
(Le simple double-clic sur `index.html` marche aussi pour la logique, mais le mode
« installable / hors-ligne » exige d'être servi en http/https.)

## Installer sur Android (recommandé)

L'installation PWA a besoin d'une adresse **https**. Deux options :

**A. Héberger sur GitHub Pages** (comme le projet veille-aap)
1. Créer un dépôt GitHub, y pousser le contenu de ce dossier.
2. Activer *Settings → Pages* sur la branche `main`.
3. Sur le téléphone, ouvrir l'URL `https://<compte>.github.io/<repo>/` dans Chrome.
4. Menu ⋮ → **Ajouter à l'écran d'accueil**. L'app s'ouvre alors en plein écran.

**B. Servir depuis le PC sur le réseau local**
`python -m http.server 8000 --bind 0.0.0.0`, puis ouvrir `http://<IP-du-PC>:8000/`
depuis le téléphone (même Wi-Fi). Note : sans https, l'ajout à l'écran d'accueil
fonctionne mais le mode hors-ligne peut être limité selon le navigateur.

## Bon à savoir

- **Une seule partie active.** Tout est sauvegardé en continu. *Nouvelle partie*
  (accueil) repart à zéro : elle efface aussi les **renommages** des objets masqués
  (`Objet#X`) et les **recettes** découvertes, conformément aux règles du livre.
- **Objets masqués.** Les objets fabricables inconnus s'affichent `Objet#2`, `#3`…
  On les renomme (bouton *Nommer*) au moment où la recette est découverte.
- **Fabrication.** Le calculateur ne propose que les composants **réellement possédés**
  (sac + coffre + équipé) ; la somme de leurs valeurs donne le n° de paragraphe.
  Armes & consommables sont détruits à la fabrication, les outils conservés.
- **Équipement.** Équiper une arme non encore possédée revient à « l'obtenir en main » ;
  la ranger l'ajoute alors au sac. Les armes équipées ne comptent pas dans le sac.
- **Combat semi-auto.** L'app lance les dés, compare à l'Habileté, propose les dégâts
  (type × multiplicateur, munitions, durabilité) et journalise — tout reste ajustable
  manuellement (compteurs +/− sur chaque valeur).

## Mettre à jour les données

Les données proviennent des fichiers `.md` de `_inbox/livre_des_morts`. Pour corriger
une valeur, éditer `data.js` (structure `DATA`) — c'est la seule source à modifier.

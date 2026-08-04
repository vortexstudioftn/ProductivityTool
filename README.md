# Élan ⚡

**L'endroit que l'on ouvre le matin — et que l'on garde ouvert toute la journée pour avancer.**

Élan réunit sur un seul écran ce qu'il faut pour dérouler une journée : les tâches du jour, un
minuteur de focus, un bloc-notes et la progression. Pas de compte, pas de serveur, pas de
distraction : tout vit dans votre navigateur.

## Fonctionnalités

- **Aujourd'hui** — la liste des tâches du jour, avec trois niveaux de priorité, édition en place
  (double-clic ou ✎) et la touche `/` pour sauter dans la saisie depuis n'importe où.
- **Report automatique** — au passage à minuit (même si l'onglet reste ouvert), les tâches non
  terminées sont reportées au jour suivant et marquées `↻`. Rien ne se perd, rien ne s'oublie.
- **Focus** — un minuteur type Pomodoro (25 min de travail, 5 min de pause, grande pause de
  15 min toutes les 4 sessions). Il est basé sur des horodatages, pas sur un simple décompte :
  un onglet mis en veille par le navigateur reste exact et rattrape les phases manquées. Le temps
  restant s'affiche dans le titre de l'onglet, et un carillon discret signale les fins de phase.
- **Bloc-notes** — une zone pour se vider la tête, sauvegardée automatiquement.
- **Progression** — tâches terminées, sessions et minutes de focus du jour, et la série 🔥 de
  jours actifs consécutifs pour entretenir… l'élan.
- **Local d'abord** — persistance en `localStorage`, aucune donnée ne quitte la machine.
- **Confort** — thèmes clair et sombre (selon le système), interface responsive, en français.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
```

Autres commandes :

```bash
npm test           # tests unitaires (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run preview    # sert le build de production
```

## Stack

React 19 · Vite 8 · TypeScript 7 · Vitest 4. Aucune dépendance d'exécution en dehors de React.

## Structure

```
src/
  App.tsx               assemblage de l'écran + persistance + changement de jour
  components/
    Header.tsx          salutation, date, série de jours actifs
    StatsBar.tsx        progression du jour
    TaskBoard.tsx       saisie et liste des tâches
    FocusTimer.tsx      minuteur focus (affichage, titre d'onglet, carillon)
    Notes.tsx           bloc-notes autosauvegardé
  lib/
    types.ts            modèle de données
    date.ts             clés de journée, formats français
    store.ts            logique des tâches, report, série, réducteur d'état
    timer.ts            machine à états du minuteur (pure, testée)
    storage.ts          lecture/écriture localStorage
    __tests__/          31 tests sur la logique pure
```

La logique (report, série, transitions du minuteur…) est écrite en fonctions pures dans
`src/lib/`, séparées des composants : c'est là que vivent les tests, et c'est là qu'il est
facile d'ajouter des règles.

## Données

Tout est stocké sous la clé `elan-state-v1` du `localStorage`. Supprimer cette clé (ou les
données de site) remet l'application à zéro.

## Idées pour la suite

- Vue semaine et historique des journées passées
- Réglages du minuteur (durées, son, démarrage automatique)
- PWA installable et utilisable hors-ligne
- Export / import JSON des données
- Tests bout-en-bout (Playwright)
- Déploiement automatique (GitHub Pages)

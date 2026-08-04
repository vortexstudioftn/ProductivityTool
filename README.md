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
- **Installable (PWA)** — manifeste et service worker : Élan s'ajoute à l'écran d'accueil du
  téléphone et fonctionne hors-ligne dès la première visite.
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

## Sur téléphone

Chaque poussée sur la branche principale déclenche les tests puis un déploiement automatique
sur GitHub Pages :

**<https://vortexstudioftn.github.io/ProductivityTool/>**

Ouvrez cette adresse sur le téléphone, puis installez Élan comme une app :

- **Android (Chrome)** : menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »)
- **iPhone / iPad (Safari)** : bouton Partager → « Sur l'écran d'accueil »

Élan s'ouvre alors en plein écran avec son icône ⚡ et reste utilisable hors-ligne (stratégie
« réseau d'abord, cache en secours »).

> Les données vivent dans le navigateur de chaque appareil : le téléphone et l'ordinateur ont
> chacun leur propre liste. La synchronisation entre appareils est une piste pour la suite.

Pour essayer sans déployer, téléphone et ordinateur sur le même Wi-Fi :

```bash
npm run dev -- --host    # puis ouvrir http://<IP-de-l'ordinateur>:5173 sur le téléphone
```

## Sur le VPS

Le workflow contient un job « Déploiement VPS » : à chaque poussée, il construit l'app, la
copie sur le serveur (adresse dans `VPS_HOST`, en tête du job dans
`.github/workflows/deploy.yml`) et provisionne nginx avec `deploy/vps-provision.sh` —
script idempotent : installation de nginx si absent (apt/dnf/yum/apk), vhost avec en-têtes
de cache et repli SPA, pare-feu, SELinux, rechargement.

Une seule chose à faire pour l'activer : créer le secret **`VPS_SSH_KEY`** (clé privée SSH
dédiée au déploiement, dont la clé publique est autorisée dans
`/root/.ssh/authorized_keys` du serveur) dans *Settings → Secrets and variables → Actions*.
Tant que le secret n'existe pas, le job s'ignore avec une simple notice. L'authentification
par mot de passe n'est pas utilisée : la plupart des serveurs SSH la refusent, et une clé
dédiée est de toute façon plus sûre.

L'app est alors disponible sur `http://<VPS_HOST>/`. En HTTP sur une IP nue, les
navigateurs désactivent le service worker : pas de hors-ligne ni d'installation complète.
Avec un domaine pointé sur le serveur, on peut ajouter le HTTPS (Let's Encrypt) et
retrouver toute la PWA.

## Stack

React 19 · Vite 8 · TypeScript 7 · Vitest 4. Aucune dépendance d'exécution en dehors de React.

## Structure

```
public/
  manifest.webmanifest  identité PWA (nom, icônes, couleurs)
  sw.js                 service worker hors-ligne
  icons/                icônes d'application
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
- Synchronisation entre appareils (aujourd'hui, chaque navigateur garde ses données)
- Export / import JSON des données
- Tests bout-en-bout (Playwright)

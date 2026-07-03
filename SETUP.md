# Capitaine — mise en service (synchro + hébergement)

L'app fonctionne déjà en **mode local** (données sur un seul appareil). Pour que
Julien et Auriane partagent les **mêmes** données, on branche Supabase (gratuit),
puis on met l'app en ligne pour l'installer sur les téléphones.

---

## Étape 1 — Créer le projet Supabase (≈ 5 min, à faire par toi)

1. Va sur https://supabase.com → **Start your project** → connecte-toi (GitHub ou email).
2. **New project** : nom `capitaine`, choisis une région proche (Europe / Frankfurt),
   définis un mot de passe de base de données (garde-le, mais on n'en aura pas besoin ici).
3. Attends que le projet soit prêt (~2 min).

## Étape 2 — Créer la base

1. Dans le projet : menu **SQL Editor** → **New query**.
2. Ouvre le fichier `supabase/schema.sql` de ce dépôt, **remplace** `EMAIL_AURIANE_ICI`
   par l'email réel d'Auriane, colle tout, puis **Run**.

## Étape 3 — Récupérer les clés

1. Menu **Project Settings** (roue crantée) → **API**.
2. Copie :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   (Ces deux valeurs sont publiques, pas de secret.)
3. À la racine de `capitaine/`, copie `.env.example` en `.env` et colle les valeurs.

## Étape 4 — Tester en local

```
npm run dev
```

L'app affiche maintenant un écran de connexion. Entre ton email → tu reçois un
**lien magique** → clique dessus → tu es connecté et synchronisé. Fais pareil avec
le compte d'Auriane : vous verrez les mêmes données en temps réel.

> Astuce : dans Supabase → **Authentication → Providers → Email**, garde « Email »
> activé. Pas besoin de mot de passe, le lien magique suffit.

---

## Étape 5 — Mettre en ligne (hébergement gratuit)

Recommandé : **Vercel** (l'app est une PWA statique, l'app utilise un routeur par
hash donc aucune config de réécriture n'est nécessaire).

1. Pousse ce dossier sur un dépôt GitHub.
2. Va sur https://vercel.com → **Add New → Project** → importe le dépôt.
3. Framework : **Vite** (détecté automatiquement). Build : `npm run build`, output : `dist`.
4. **Environment Variables** : ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
   (les mêmes que dans `.env`).
5. **Deploy**. Tu obtiens une URL type `https://capitaine.vercel.app`.
6. Dans Supabase → **Authentication → URL Configuration** : ajoute cette URL dans
   **Site URL** et **Redirect URLs** (sinon le lien magique ne reviendra pas au bon endroit).

## Étape 6 — Installer sur les téléphones

- **iPhone (Julien)** : ouvre l'URL dans Safari → bouton Partager → **Sur l'écran d'accueil**.
- **Android (Auriane, Pixel 5)** : ouvre l'URL dans Chrome → menu ⋮ → **Installer l'application**.

C'est fait : icône Capitaine sur l'écran d'accueil, plein écran, synchronisé. 🐾

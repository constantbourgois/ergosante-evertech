# Conventions du projet

## This is NOT the Next.js you know

Cette version comporte des changements de rupture — API, conventions et structure de
fichiers peuvent différer de ce que vous connaissez. **Lisez le guide correspondant
dans `node_modules/next/dist/docs/` avant d'écrire du code.** Tenez compte des avis de
dépréciation.

## Avant de coder

Le cadrage fonctionnel est dans `docs/`. Trois documents à lire avant d'ouvrir un
fichier source :

- `docs/PLAN.md` — périmètre, modèle de données, moteur de calcul, jalons L0→L8
- `docs/CATALOGUE.md` — données produit réelles, barème de transport, cas de recette
- `docs/QUESTIONS-OUVERTES.md` — décisions actées, et ce qui reste ouvert

## Règles non négociables

**`lib/pricing/` est un module pur.** Il ne connaît ni Prisma, ni React, ni aucune I/O.
Il reçoit des objets simples et retourne un devis calculé. C'est la condition pour le
tester sérieusement — et c'est là qu'un bug coûte de l'argent réel.

**Les prix d'achat ne sont jamais importés.** La colonne « V.A » du fichier tarifaire
est ignorée à l'import. Ne l'ajoutez pas au schéma Prisma, même « pour plus tard » :
une donnée absente de la base ne peut pas fuiter.

**Le format pré-coupé prime sur la découpe.** Quand les dimensions saisies
correspondent exactement à un format standard, le résolveur retient la référence à la
pièce. C'est une règle de justesse tarifaire, pas une optimisation : l'inverse
surfacture le client jusqu'à 22 %.

**Aucun prix n'est calculé côté client.** Le navigateur peut afficher une estimation,
mais le montant du devis est recalculé côté serveur avant émission.

**Au-delà de 40 kg, aucun total n'est affiché.** Le devis bascule en statut
`A_CONSULTER`. Ne jamais extrapoler le barème de transport.

**Les corrections tarifaires se font à l'import**, pas par des écritures manuelles en
base. Quatre lignes du tarif source sont alignées — voir `docs/CATALOGUE.md §5.1`.

## Arrondis

Chaque ligne est calculée en pleine précision puis arrondie au centime. Le sous-total
est la somme exacte des lignes arrondies. La TVA est calculée sur le total HT arrondi.
Le PDF doit rester vérifiable à la calculette.

## Langue

Toute l'interface, les libellés, les e-mails et le PDF sont en français. Le code, les
noms de variables et les commentaires sont en anglais.

## Commandes

```
npm run dev       développement
npm run build     build de production
npm run lint      eslint
npm run test      vitest
```

## Infrastructure

Vercel (région UE) + Supabase Postgres et Storage (région UE) + Brevo.

Deux pièges documentés dans `docs/PLAN.md §9.1` :
- Prisma exige `DATABASE_URL` poolée (6543) **et** `DIRECT_URL` directe (5432),
  `directUrl` déclaré dans `schema.prisma` — sinon `prisma migrate` échoue au premier
  déploiement.
- La région Supabase se choisit à la création du projet et ne se change plus.

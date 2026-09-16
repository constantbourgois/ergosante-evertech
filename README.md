# Devis Tapis Antifatigue

Web-app permettant aux clients de générer et télécharger **leurs devis en autonomie**
pour la gamme de tapis antifatigue et de revêtements de sol ergonomiques EVERMAT
(Evertech SAS).

Le client crée son compte, décrit son poste de travail, saisit quantité, dimensions et
spécificités, et obtient immédiatement un devis chiffré qu'il télécharge en PDF. Côté
administration, tout ce qui chiffre — tarifs, remises, transport, charte graphique —
est configurable sans redéploiement.

## Documentation

| Document | Contenu |
| --- | --- |
| [docs/PLAN.md](docs/PLAN.md) | Plan de projet : périmètre, parcours, modèle de données, moteur de calcul, back-office, stack, jalons, critères d'acceptation |
| [docs/CATALOGUE.md](docs/CATALOGUE.md) | Analyse croisée du tarif et du catalogue : structure produit, barème de transport, **incohérences relevées**, cas de recette |
| [docs/QUESTIONS-OUVERTES.md](docs/QUESTIONS-OUVERTES.md) | Décisions actées, contradictions à lever, propositions en attente |

## En bref

- **Cinq types de poste de travail** structurent le choix : fixe, mobile, pivotant,
  spécifique (métallurgie), milieu humide (dont agroalimentaire).
- **Une référence recommandée** est pré-sélectionnée par type de poste.
- **Deux spécificités** combinables sur la gamme mousse : ESD (dissipation
  électrostatique) et B1 (réaction au feu, DIN 4102-1). Chaque combinaison est une
  référence distincte, avec son propre prix.
- **Trois unités de vente** : au m² (découpe), à la pièce (formats 65 × 95 et
  91 × 152), au mètre linéaire (chant jaune, sur périmètre complet).
- **Transport** : forfait par tranche de poids, jusqu'à 40 kg. Au-delà, bascule en
  « nous consulter » plutôt qu'un prix faux.

## Points d'attention identifiés au cadrage

1. **Le format pré-coupé est 12 à 18 % moins cher au m² que la découpe.** Le moteur
   doit le préférer dès que les dimensions correspondent, sous peine de surfacturer
   jusqu'à 22 %.
2. **Quatre références sortaient de la logique tarifaire de leur gamme** — deux
   analyses indépendantes les ont désignées, décision prise de les aligner à l'import.
3. **Les prix d'achat ne sont pas importés.** Une donnée absente de la base ne peut
   pas fuiter : le contrôle porte sur l'import, pas sur la sérialisation.
4. **Le devis est multi-lignes** : les demandes réelles portent sur plusieurs tapis de
   dimensions différentes.
5. **L'accès est approuvé manuellement** : vérification d'e-mail *et* approbation
   administrateur avant de voir le moindre prix.

## Ce qui reste à préciser

Aucun bloquant : les développements peuvent démarrer.

| Point | À quel moment |
| --- | --- |
| Poids du chant `CHAN01` (estimé à 0,25 kg/ml, à confirmer) | Avant le lot L5 |
| Largeur maximale de découpe (laize) — la longueur, elle, est libre | Avant la mise en production |
| Référence recommandée pour les postes mobile, spécifique et milieu humide | Avant le lot L4 |
| Devis passés servant de recette au moteur de calcul | Avant le lot L3 |

Détail dans [QUESTIONS-OUVERTES.md](docs/QUESTIONS-OUVERTES.md#6-ce-qui-reste).

## Infrastructure

**Vercel** (hébergement, région UE) + **Supabase** (Postgres et stockage des PDF,
région UE) + **Brevo** (e-mails transactionnels). Détail et contraintes serverless
dans [PLAN.md §9](docs/PLAN.md#9-stack-technique).

## Statut

Phase de cadrage. Aucun code applicatif n'a encore été écrit : ce dépôt contient les
spécifications.

# Plan de projet — Web-app de devis automatiques

> **Sources** : note vocale de cadrage du 16/09/2026 ; extrait du tarif Evertech
> (famille TAPISEVE + barème transport France) ; catalogue EVERMAT / EVERTECH SAS
> (8 p.) ; demande client Ergosanté du 14/09/2026 ; arbitrages client du 16/09/2026.
>
> Les décisions actées et les points restants sont dans
> [QUESTIONS-OUVERTES.md](QUESTIONS-OUVERTES.md). L'analyse du tarif est dans
> [CATALOGUE.md](CATALOGUE.md). ⚠️ signale un point encore ouvert.

---

## 1. Objectif

Permettre à une clientèle identifiée d'obtenir **un devis chiffré sans intervention
humaine**, pour la gamme de tapis antifatigue EVERMAT, et de le télécharger en PDF.

La demande d'Ergosanté du 14/09 illustre exactement ce que l'outil doit absorber :
trois tapis de dimensions différentes (220×91, 160×91, 160×60 cm), sur postes
d'usinage sans contrainte particulière, avec demande de prix, de délai **et de
préconisation de référence**. Aujourd'hui cette demande mobilise un commercial ;
demain le client doit pouvoir la chiffrer seul.

## 2. Périmètre V1

1. Création de compte, vérification d'e-mail, **puis approbation manuelle** par un
   administrateur avant accès au configurateur.
2. Assistant de configuration : type de poste → modèle → quantité → dimensions →
   spécificités.
3. **Devis multi-lignes** : plusieurs tapis de dimensions différentes dans un devis.
4. Moteur de calcul : résolution de la référence, prix, remise, transport.
5. Restitution à l'écran puis **téléchargement du PDF** (pas d'envoi par e-mail).
6. Back-office : catalogue, tarifs, remises par client, barème de transport, charte
   graphique du PDF.
7. Historique des devis d'un client.

**Hors périmètre** : paiement, signature électronique, formes non rectangulaires,
impression de logo, connexion ERP/CRM, multi-langue et multi-devise (euro, français
uniquement), livraison hors France.

## 3. Utilisateurs

| Rôle | Ce qu'il fait |
| --- | --- |
| **Client** | Crée son compte, configure un besoin, obtient un prix, télécharge un PDF, retrouve ses devis |
| **Administrateur** | Approuve les inscriptions, paramètre le catalogue, les tarifs, les remises, le transport, la charte du PDF |

Pas de rôle commercial distinct en V1 : l'administrateur approuve déjà les comptes,
et un troisième rôle ajouterait de la complexité d'autorisation sans bénéfice tant
qu'une seule personne gère l'outil. `role` reste une énumération, extensible sans
migration lourde.

## 4. Parcours client

### 4.1 Accès — trois étapes, pas deux

```
Inscription  →  E-mail de vérification  →  Compte vérifié
                                               ↓
                                    En attente d'approbation
                                    (notification à l'admin)
                                               ↓
                                    Approuvé  →  Configurateur
```

La grille est une grille professionnelle : l'accès est **approuvé manuellement**.
Deux états distincts sont donc nécessaires — `emailVerifiedAt` et `approvedAt` — et
ils ne se confondent pas : un client peut avoir prouvé son adresse sans être encore
autorisé à voir les prix.

Écrans à prévoir : attente de vérification (avec renvoi du lien), attente
d'approbation, compte refusé. Trois gabarits d'e-mail côté Brevo : vérification,
compte approuvé, compte refusé.

- Lien de vérification à usage unique, valable 24 h.
- Réinitialisation de mot de passe par le même canal.

### 4.2 Configurateur

Assistant linéaire, récapitulatif permanent, prix mis à jour en direct.

**Étape 1 — Type de poste de travail**

C'est l'axe du catalogue, et le vocabulaire du client : Ergosanté écrit « postes
d'usinage », pas « environnement sec ».

| Type de poste | Modèles proposés | Recommandé |
| --- | --- | --- |
| **Fixe** | Evermat MB, Evermat Stand | MB |
| **Mobile** | Evermat Walk, Evermat ML | ⚠️ à désigner |
| **Pivotant** | Evermat Turn | Turn (seul) |
| **Spécifique** — métallurgie, huiles, copeaux, soudure | Evermat NBR, Evermat SBR | ⚠️ à désigner |
| **Milieu humide** — dont agroalimentaire | Saniflex SBR, Saniflex NBR | ⚠️ à désigner |

**Étape 2 — Modèle**

Une référence est **pré-sélectionnée** par type de poste (`isRecommended`), le client
peut en changer. Chaque modèle est présenté avec sa description catalogue, son
épaisseur, sa couleur et son visuel — c'est ce qui permet au client de trancher seul
entre deux modèles d'un même poste.

**Étape 3 — Quantité** — entier ≥ 1, par ligne.

**Étape 4 — Dimensions** — longueur et largeur **en centimètres**.

- **Format standard** — 65 × 95 cm (gamme mousse, NBR, SBR) ou 91 × 152 cm (Saniflex),
  tarifé à la pièce.
- **Découpe sur mesure** — tarifée au m². Minimum **60 cm** sur chaque côté,
  **aucune longueur maximale**.
  ⚠️ Reste à confirmer : existe-t-il une **largeur maximale** (laize) ? C'est une
  contrainte différente de la longueur — un tapis se découpe dans un rouleau de laize
  finie. `maxCutWidthCm` est donc modélisé comme nullable : vide = pas de limite, ce
  qui permet de démarrer sans réponse et d'en ajouter une sans migration.

**Étape 5 — Spécificités**

- **ESD** — dissipation des décharges électrostatiques.
- **B1** — réaction au feu, classement DIN 4102-1 (« ignifuge » de la note de cadrage).
- **Chant jaune 5 cm** (`CHAN01`) — facturé au mètre linéaire sur le **périmètre
  complet**.

Disponibilité par modèle : les cinq modèles mousse acceptent les trois options ;
NBR et SBR **le chant seul** ; les Saniflex **aucune**.

**Règle d'affichage** : une option sans référence correspondante au tarif est
**grisée**, pas masquée. Le client voit que l'ESD et le B1 existent dans la gamme mais
ne sont pas disponibles sur le modèle qu'il a choisi — c'est ce qui l'amène à
reconsidérer son modèle plutôt qu'à appeler le service client. Un libellé au survol
explique pourquoi.

> **Afficher le métrage du chant.** Sur l'exemple Ergosanté, le périmètre complet des
> trois tapis représente 15,64 ml, soit **738,99 €** — 79 % du prix des tapis eux-mêmes.
> Un client qui coche l'option sans voir le métrage aura l'impression d'une erreur.

**Étape 6 — Ajouter une autre ligne**

Le client doit pouvoir ajouter un deuxième, un troisième tapis avant de valider. La
demande Ergosanté en comporte trois ; un configurateur mono-produit obligerait à
générer trois devis séparés, ce que personne ne fera.

### 4.3 Restitution

Récapitulatif, lignes détaillées (référence retenue, quantité, dimensions, surface,
prix), options, remise, transport, totaux HT / TVA 20 % / TTC, validité **1 mois**,
délai **2 à 3 semaines**, bouton **Télécharger le PDF**.

Le devis est persisté à sa génération, avec numéro, et reste consultable depuis le
tableau de bord.

**Cas « nous consulter »** : au-delà de 40 kg, le devis ne se chiffre pas (§6.4). Le
client voit sa configuration récapitulée et un message l'invitant à être recontacté ;
le devis est conservé en brouillon et une notification part vers le service client.

## 5. Modèle de données

### 5.1 Le choix structurant : matrice de références, pas options additives

Le tarif impose une correction par rapport au cadrage initial. La note vocale
décrivait des spécificités qui « paramètrent un tarif ». Dans les faits, **chaque
combinaison est une référence à part entière, avec son propre prix** :

| Référence | Désignation | Prix/m² |
| --- | --- | --- |
| `10101` | Evermat Stand | 219,70 € *(après alignement)* |
| `10101B1` | Evermat Stand B1 | 237,58 € |
| `10101ESD` | Evermat Stand ESD | 243,75 € |
| `10101ESDB1` | Evermat Stand B1+ESD | 261,63 € |

Le modèle retenu est donc : **une ligne de base par référence du tarif**, et un
résolveur qui traduit le choix du client en référence. C'est aussi ce qui garantit que
le devis porte la référence attendue par la logistique.

### 5.2 Entités

```
User
  id, email, passwordHash, role (CLIENT | ADMIN)
  emailVerifiedAt            → adresse prouvée
  approvedAt, approvedBy     → accès autorisé par un administrateur
  companyName, phone
  discountRateId?
  createdAt, updatedAt

ProductFamily                « Evermat Stand, Turn, Walk, MB, ML, NBR, SBR, Saniflex… »
  id, code, name, description, imageUrl
  workstationType            → FIXE | MOBILE | PIVOTANT | SPECIFIQUE | MILIEU_HUMIDE
  isRecommended              → référence pré-sélectionnée pour ce type de poste
  thicknessMm                → 13 ou 14
  colorLabel                 → « Gris RAL 7016 », « Noir RAL 9005 », « Rouge »
  supportsESD, supportsB1, supportsEdging
  minCutCm                   → 60
  maxCutWidthCm              → nullable ; vide = pas de limite  ⚠️ à confirmer
                               (pas de longueur maximale)
  isActive

ProductVariant               « une ligne du tarif = une référence »
  id, reference              → 10101, 10101ESDB1, 20102SBRU…
  familyId
  hasESD, hasB1
  salesUnit                  → SQM | UNIT | LINEAR_METER
  standardLengthCm, standardWidthCm  → si UNIT (65×95, 91×152)
  salePrice                  → €/m², €/pièce ou €/ml selon salesUnit
  weight                     → kg/m² si SQM, kg/pièce si UNIT
                               (la colonne « V.A » du tarif n'est pas importée — §10)
  isActive

DiscountRate
  id, name, percentage
  appliesToTransport         → false par défaut
  validFrom, validUntil

ShippingZone                 → « France » seule zone alimentée
ShippingBracket
  id, zoneId, maxWeightKg, flatPrice
  → 1→20,39 € … 40→88,74 €   au-delà : « nous consulter »

Quote
  id, reference, userId
  status                     → BROUILLON | A_CONSULTER | EMIS | EXPIRE
  subtotal, discountAmount, shippingCost, taxAmount, total
  vatRate (20), validUntil, totalWeightKg
  pdfUrl?, createdAt
  pricingSnapshot            → copie figée des tarifs employés

QuoteLine
  id, quoteId, variantId, variantReferenceSnapshot
  quantity, lengthCm, widthCm, unitAreaSqm, totalAreaSqm
  hasEdging, edgingLinearMeters, edgingPrice
  unitPrice, lineTotal, lineWeightKg

BrandingSettings
  logoUrl, primaryColor, secondaryColor, fontFamily
  companyAddress, legalMentions, quoteFooter
  quoteValidityDays (30), defaultVatRate (20)
  leadTimeLabel              → « 2 à 3 semaines »
```

> **Figer les tarifs dans le devis.** Un devis émis doit rester lisible et opposable
> après une hausse tarifaire. `pricingSnapshot` conserve les valeurs employées au
> moment du calcul. Sans cela, rouvrir un devis de mars affichera les prix de septembre.

## 6. Moteur de calcul

Module pur, sans I/O, testé unitairement.

### 6.1 Résolution de la référence et prix produit

```
1. (famille, ESD?, B1?) → variantes candidates
2. si (longueur, largeur) == format standard d'une variante UNIT
        → variante UNIT,  prixLigne = quantité × salePrice
   sinon → variante SQM,
        surfaceUnitaire = (longueurCm/100) × (largeurCm/100)
        prixLigne       = surfaceUnitaire × quantité × salePrice
```

> **Le format standard doit être préféré à la découpe.** Sur Evermat Stand, la pièce
> 65 × 95 revient à 186,85 €/m² contre 219,70 €/m² en découpe. Un client demandant
> exactement 65 × 95 paierait jusqu'à 22 % de trop si le résolveur choisissait la
> découpe. Ce n'est pas une optimisation, c'est une règle de justesse tarifaire — et
> un cas de test obligatoire.

### 6.2 Chant

```
métrageChant = quantité × 2 × (longueur + largeur)      → périmètre complet
prixChant    = métrageChant × 47,25 €/ml
```

Indisponible sur Saniflex.

```
sousTotal = Σ prixLigne + Σ prixChant
```

### 6.3 Remise

```
remise = sousTotal × tauxRemise / 100
netHT  = sousTotal − remise
```

La remise ne s'applique **pas** au transport (`appliesToTransport = false`).

**Garde-fou de remise** : plafond paramétrable, **30 %** par défaut. Au-delà,
l'enregistrement du taux demande une confirmation explicite.

> **Un plafond en pourcentage, pas en marge.** Les prix d'achat n'étant pas importés
> (§10), l'application ne connaît pas le coût de revient et ne peut donc pas empêcher
> une vente à perte. C'est un arbitrage assumé : le plafond de 30 % est la seule
> barrière, et il tient parce que les taux sont saisis par un administrateur, pas par
> le client. Si un jour une remise doit être bornée par la marge réelle, il faudra
> réintroduire le coût — et la question de sa confidentialité avec lui.

### 6.4 Transport

Forfaits par tranche de poids, confirmés par le barème fourni.

```
poidsTotal = Σ  variante.salesUnit == SQM
                 ? quantité × surfaceUnitaire × poidsAuM2
                 : quantité × poidsParPièce
frais      = forfait de la première tranche dont maxWeightKg ≥ poidsTotal
```

Barème France : 1 kg → 20,39 € · 3 → 25,18 € · 5 → 28,17 € · 10 → 31,26 € ·
15 → 34,27 € · 20 → 37,98 € · 25 → 41,91 € · 30 → 55,59 € · 40 → 88,74 €.

**Au-delà de 40 kg : « nous consulter ».** Le devis bascule en statut
`A_CONSULTER`, n'affiche aucun total, conserve la configuration et déclenche une
notification vers le service client. 40 kg représentent 8 m² de mousse : ce n'est pas
un cas limite mais un cas courant, et il vaut mieux ne pas donner de prix qu'en donner
un faux.

### 6.5 Total et arrondis

```
totalHT  = netHT + fraisTransport
tva      = totalHT × 20 %
totalTTC = totalHT + tva
```

Règle d'arrondi : chaque ligne est calculée en pleine précision puis **arrondie au
centime**, le sous-total est la somme exacte des lignes arrondies, remise et transport
sont arrondis au centime, la TVA est calculée sur le total HT arrondi. C'est la
convention qui rend le PDF vérifiable à la calculette — un total qui ne retombe pas
sur la somme des lignes génère des appels au service client.

### 6.6 Exemple de référence — demande Ergosanté du 14/09/2026

« Trois tapis anti-fatigue : 220×91, 160×91, 160×60 cm, postes d'usinage, sans
contraintes particulières. Quelle référence préconisez-vous ? »

Parcours : poste **fixe** → modèle recommandé **`10104` Evermat MB**, seul modèle dont
la description catalogue mentionne les machines outils → trois lignes, découpe,
aucune spécificité.

| Ligne | Dimensions | Surface |
| --- | --- | --- |
| 1 | 220 × 91 cm | 2,0020 m² |
| 2 | 160 × 91 cm | 1,4560 m² |
| 3 | 160 × 60 cm | 0,9600 m² |
| | **Total** | **4,4180 m²** |

```
produit    = 4,4180 × 202,15         =  893,10 €
poids      = 4,4180 × 5              =   22,09 kg  → tranche ≤ 25 kg
transport  =                             41,91 €
TOTAL HT   =                            935,01 €
TVA 20 %   =                            187,00 €
TOTAL TTC  =                          1 122,01 €
```

À confronter au devis réellement établi par le service client : c'est la seule preuve
que l'automatisation reproduit le chiffrage humain plutôt qu'un chiffrage plausible.

### 6.7 Exigences de test

- Résolution format standard vs découpe, aux dimensions exactes 65 × 95 et 91 × 152.
- Les quatre combinaisons ESD / B1 sur une même famille.
- Chant : périmètre complet, indisponibilité sur Saniflex et sur NBR/SBR selon §3.1.
- Bornes de tranches de transport (poids exactement égal à une borne : 25,00 kg).
- **Dépassement de 40 kg → statut `A_CONSULTER`, aucun total affiché.**
- Remise : plafond souple, blocage sous le coût.
- Devis multi-lignes mêlant unités de vente différentes (m² + pièce + ml).
- Arrondis : total TTC égal à la somme des lignes arrondies.
- Dimensions sous 60 cm → refus.

## 7. Back-office d'administration

**Familles** — libellé, visuel, type de poste, référence recommandée, épaisseur,
couleur, options disponibles, bornes de découpe, activation.

**Références** — une ligne par référence du tarif. Prévoir **import / export** : le
tarif est déjà un tableau, et la saisie manuelle de ~50 références à chaque révision
ne tiendra pas. L'import doit **refuser** une référence sans poids plutôt que la
charger à zéro (un poids nul sous-facture le transport).

**Comptes** — file des inscriptions en attente, approbation / refus, rattachement
d'une remise.

**Remises** — taux, comptes concernés, validité, application au transport, plafonds.

**Transport** — tranches et forfaits par zone, contrôle de cohérence à
l'enregistrement (pas de trou ni de chevauchement).

**Charte graphique du PDF** — logo, couleurs, police, coordonnées, mentions légales,
pied de page, validité, TVA, libellé de délai, avec **aperçu avant enregistrement**.

**Devis** — liste filtrable par client et période, consultation, export, suivi des
devis en statut `A_CONSULTER`.

Deux exigences transverses :

- **Journal des modifications tarifaires** : qui a changé quel prix et quand. Sur un
  outil qui produit des engagements commerciaux, c'est ce qui permet d'expliquer un
  écart six mois plus tard.
- **Contrôles de saisie stricts** : prix négatif, tranche inversée, remise à 120 % ou
  prix de vente incohérent avec la V.A doivent être refusés.

## 8. Génération du PDF

- Rendu serveur avec **`@react-pdf/renderer`** (§9), gabarit alimenté par
  `BrandingSettings`.
- Contenu : en-tête, numéro et date, validité (1 mois), coordonnées client,
  lignes détaillées (**référence**, désignation, dimensions, quantité, surface,
  options), remise, transport, totaux HT / TVA / TTC, délai (2 à 3 semaines),
  mentions légales.
- Le PDF est **stocké** et rattaché au devis, pas régénéré à chaque téléchargement :
  le document remis au client ne doit pas changer entre deux téléchargements.
- Nommage : `Devis-{reference}-{date}.pdf`.
- La colonne « V.A » **ne doit jamais apparaître** sur le document client.

## 9. Stack technique

Les briques applicatives reprennent celles de `boplan-riashop-app` ; l'infrastructure,
elle, s'en écarte : **Vercel** pour l'hébergement et **Supabase** pour la base et le
stockage, là où le projet frère est sur Render.

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| **Hébergement** | **Vercel**, région de fonction en UE (`cdg1` Paris ou `fra1` Francfort) |
| **Base de données** | **Supabase Postgres** (région UE) + Prisma 7 |
| **Stockage des PDF** | **Supabase Storage**, bucket privé, URL signées |
| Authentification | NextAuth v5 (credentials + vérification e-mail + approbation) |
| UI | Tailwind CSS 4 + shadcn / Base UI |
| Import tarifaire | `xlsx` (déjà employé sur le projet frère) |
| E-mails transactionnels | **Brevo** |
| PDF | **`@react-pdf/renderer`** |
| Tests | Vitest |

Deux fournisseurs plutôt que trois : Supabase porte la base **et** le stockage. ⚠️ Si
la base doit rester ailleurs (Neon, Render), seule la chaîne de connexion change — le
reste du plan tient.

### 9.1 Trois contraintes propres au serverless

Passer de Render à Vercel n'est pas un simple changement d'hébergeur : l'exécution
devient serverless, ce qui impose trois précautions à traiter dès le lot L0.

**Le système de fichiers est éphémère.** Aucun PDF ne peut être écrit sur disque : le
stockage objet n'est pas un confort, c'est la seule option. Ce que le plan prévoyait
déjà (§8), mais qui devient non négociable.

**Prisma a besoin d'un pooler.** Chaque invocation de fonction ouvre sa propre
connexion ; sous charge, Postgres sature. Il faut donc deux chaînes de connexion :

```
DATABASE_URL       → connexion poolée Supabase (pgBouncer, mode transaction, port 6543)
DIRECT_URL         → connexion directe (port 5432), pour les migrations Prisma
```

`directUrl` se déclare dans `schema.prisma` — sans lui, `prisma migrate` échoue à
travers le pooler. C'est une erreur classique, et elle ne se manifeste qu'au premier
déploiement.

**Les régions doivent être alignées.** Fonctions Vercel et projet Supabase dans la
même région européenne. À défaut, chaque requête traverse l'Atlantique — latence
inutile, et argumentaire RGPD affaibli. La région Supabase **se choisit à la création
du projet et ne se change pas ensuite**.

### 9.2 Pourquoi `@react-pdf/renderer` — l'argument se renforce

Ce choix tenait, sur Render, au poids de Chromium. Sur Vercel il devient presque
obligatoire : les fonctions serverless sont plafonnées à 250 Mo décompressés, et
Puppeteer n'y tient qu'au prix d'une build spéciale de Chromium, pour un document à
mise en page fixe qui n'en a aucun besoin. `@react-pdf/renderer` est du JavaScript
pur, sans binaire, et génère un devis en bien moins d'une seconde.

⚠️ Réserve inchangée : si le devis doit reproduire au pixel près un modèle graphique
existant, il faudra du HTML → PDF — et sur Vercel, cela signifie probablement sortir
la génération vers un service dédié. À trancher maintenant, la migration coûte cher
après.

> ⚠️ **Avant d'écrire la moindre ligne de code** : cette version de Next.js s'écarte
> des conventions antérieures. Lire les guides de `node_modules/next/dist/docs/` et
> respecter les avis de dépréciation, comme l'impose l'`AGENTS.md` du projet frère.

**Découpage applicatif**

```
src/
  app/
    (auth)/          inscription, connexion, vérification, attente d'approbation
    (client)/        tableau de bord, configurateur, devis
    (admin)/         comptes, catalogue, tarifs, remises, transport, charte
    api/
  lib/
    pricing/         résolveur de référence + moteur de calcul — pur, sans I/O
    pdf/             gabarit et génération
    catalog-import/  import du tarif
    auth/
  prisma/
```

`lib/pricing/` ne doit connaître ni Prisma ni React : il reçoit des objets simples et
retourne un devis calculé. C'est la condition pour le tester sérieusement.

## 10. Sécurité et conformité

- Mots de passe hachés (bcrypt/argon2).
- Jetons de vérification et de réinitialisation à usage unique, expirants, comparés
  en temps constant.
- Limitation de débit sur l'inscription, la connexion et le renvoi d'e-mail.
- **Cloisonnement strict** : un client n'accède qu'à ses propres devis, vérifié côté
  serveur à chaque accès et pas seulement par masquage d'interface.
- **Double barrière d'accès** : `emailVerifiedAt` *et* `approvedAt` requis pour
  atteindre le configurateur. Un compte vérifié mais non approuvé ne doit voir aucun prix.
- Routes d'administration protégées par contrôle de rôle côté serveur.
- Prix recalculés côté serveur avant émission : jamais de tarif faisant autorité
  depuis le navigateur.
- PDF en bucket Supabase **privé**, accès par URL signée à durée courte
  (`createSignedUrl`), générée côté serveur après vérification que le devis appartient
  bien au client connecté. Un bucket public exposerait les devis nominatifs de tous vos
  clients à qui devinerait une URL — et le réglage se change en un clic, donc à vérifier.
- **La clé `service_role` de Supabase ne quitte jamais le serveur.** Elle contourne les
  règles d'accès : exposée au navigateur, elle donne accès à tous les devis de tous les
  clients. Jamais dans un composant client, jamais dans une variable préfixée
  `NEXT_PUBLIC_`. C'est le principal risque de cette brique.

> **La colonne « V.A » n'est pas importée.** Décision prise de laisser les prix
> d'achat hors de l'application : ils n'y servent à rien puisque le devis ne les
> affiche jamais.
>
> C'est la réponse la plus solide au risque de fuite qu'ils représentaient. Une donnée
> absente de la base ne peut ni transiter dans une réponse d'API, ni être sérialisée
> par erreur dans un état React, ni se retrouver dans un export ou une sauvegarde. Le
> contrôle à ajouter n'est donc pas un filtre de sérialisation mais **un contrôle
> d'import** : l'import du tarif ignore explicitement cette colonne, et un test le
> vérifie.

**RGPD** : devis conservés 5 ans puis anonymisés ; compte inactif alerté à 2 ans et
supprimé à 3 ans ; suppression à la demande depuis le compte. ⚠️ Durées à faire valider
par votre conseil.

## 11. Jalons

| Lot | Contenu | Livrable |
| --- | --- | --- |
| **L0 — Socle** | Initialisation Next.js, Prisma, schéma, CI, **pooler et régions UE (§9.1)**, déploiement Vercel | Application vide déployée |
| **L1 — Comptes** | Inscription, vérification Brevo, **approbation manuelle**, connexion, mot de passe oublié, rôles | Un client approuvé se connecte |
| **L2 — Catalogue** | CRUD familles et références, **import du tarif**, types de poste, options, formats | Le tarif réel est en base |
| **L3 — Moteur de calcul** | `lib/pricing` : résolveur + calcul + arrondis + jeu de tests | Calcul validé contre des devis existants |
| **L4 — Configurateur** | Assistant, types de poste, préconisation, multi-lignes, prix en direct | Un client obtient un prix à l'écran |
| **L5 — Tarification avancée** | Remises, transport, **bascule « nous consulter »**, chant, TVA | Devis complet et conforme à la grille |
| **L6 — Devis & PDF** | Persistance, numérotation, charte, génération, stockage R2 | Le client télécharge son devis |
| **L7 — Historique & admin devis** | Tableau de bord client, liste admin, filtres, export | Suivi opérationnel |
| **L8 — Durcissement** | Sécurité, cloisonnement de la V.A, limitation de débit, journal tarifaire, RGPD, recette | Mise en production |

**Chemin critique** : L2 et L3 conditionnent tout le reste. Le moteur doit être figé
tôt et confronté à des devis réels déjà établis manuellement.

**Aucun préalable bloquant ne subsiste.** Restent quatre points mineurs, à trancher
en cours de route — poids du chant, largeur maximale de découpe, références
recommandées pour trois types de poste, et devis de recette. Voir
[QUESTIONS-OUVERTES.md §6](QUESTIONS-OUVERTES.md#6-ce-qui-reste).

## 12. Critères d'acceptation V1

1. Un nouveau client s'inscrit, vérifie son adresse, reste en attente, puis accède au
   configurateur une fois approuvé par un administrateur.
2. Un compte vérifié mais non approuvé ne voit **aucun prix**.
3. Il choisit « poste fixe » et se voit proposer MB (pré-sélectionné) et Stand.
4. Il saisit trois lignes de dimensions différentes dans un même devis.
5. Il ajoute l'option ESD et voit la référence passer de `10104` à `10104ESD`, avec le
   prix correspondant.
6. Une demande de 65 × 95 cm est chiffrée sur la référence à la pièce, pas en découpe.
7. Une dimension sous 60 cm est refusée.
8. Le total intègre la remise du compte (hors transport) et le transport calculé
   depuis le poids réel.
9. Une commande dépassant 40 kg n'affiche **aucun total** et bascule en « nous
   consulter », avec notification du service client.
10. Il télécharge un PDF aux couleurs de l'entreprise, conforme au montant affiché,
    portant la validité (1 mois) et le délai (2 à 3 semaines), **sans aucune mention
    de la colonne V.A**.
11. Il retrouve ce devis dans son historique et le retélécharge à l'identique.
12. Un administrateur modifie un prix au m² ; les nouveaux devis en tiennent compte,
    les devis déjà émis restent inchangés.

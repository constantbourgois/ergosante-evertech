# Décisions et questions ouvertes

Mise à jour du 16/09/2026, après arbitrage client et réception du
**catalogue EVERMAT / EVERTECH SAS** (8 pages).

- [§1 Décisions actées](#1-décisions-actées) — 20 points tranchés, à appliquer.
- [§2 Points réglés par le catalogue](#2-points-réglés-par-le-catalogue) — 4 points.
- [§3 Contradictions levées](#3-contradictions-levées) — 3 points, tous tranchés.
- [§4 Réponses complétées](#4-réponses-complétées) — 3 points.
- [§5 Propositions en attente de validation](#5-propositions-en-attente-de-validation) — 6 points.
- [§6 Ce qui reste](#6-ce-qui-reste) — 3 points mineurs, aucun bloquant.

> **Aucun bloquant ne subsiste.** Les développements L1 à L8 peuvent démarrer.

---

## 1. Décisions actées

| # | Question | **Décision** | Conséquence technique |
| --- | --- | --- | --- |
| 1 | Transport au-delà de 40 kg | **« Nous consulter »** | Au-delà de 40 kg, le devis ne se chiffre pas : bascule vers une demande au service client. Le devis est conservé en brouillon avec la configuration, et un e-mail part vers `serviceclient@evertech-france.com`. Le client ne doit jamais voir un total faux. |
| 2 | Les 4 lignes tarifaires hors schéma | **Aligner** (`10101`→219,70 · `10104B1`→220,03 · `10102B1ESDU`→138,13 · `10105U`→105,63) | Corriger à l'import. Conserver les valeurs d'origine en commentaire dans le fichier de seed, pour traçabilité. |
| 3 | Anomalies Saniflex | **Conformes, ne pas corriger** | `20102SBR` garde le prix du NBR, `20102SBRU` garde sa V.A. Documenter pour que l'import ne les signale pas à chaque exécution. |
| 8 | Délai de livraison | **2 à 3 semaines**, mention fixe sur le devis | Pas de délai par référence : une chaîne de caractères dans `BrandingSettings`. Simplifie le modèle. |
| 9 | Préconisation de référence | **Référence recommandée par défaut**, par type de poste | Champ `ProductFamily.isRecommended` (une seule par type de poste). Pré-sélectionnée, modifiable. |
| 10 | Règle du chant `CHAN01` | **Périmètre complet** | `métrage = quantité × 2 × (L + l)`. Sur l'exemple Ergosanté : 15,64 ml → 738,99 €. Afficher le métrage au client, ce montant surprend. |
| 11 | Inscription | **Validation manuelle** | Un compte vérifié par e-mail reste en attente d'approbation admin avant d'accéder au configurateur. Deux états distincts : `emailVerifiedAt` et `approvedAt`. Prévoir la notification à l'admin et l'e-mail d'activation au client. |
| 12 | Envoi du PDF | **Téléchargement seul** | Pas d'envoi automatique. Le stockage du PDF reste nécessaire (retéléchargement à l'identique). |
| 14 | Zones de livraison | **France uniquement** | `ShippingZone` conservé au modèle mais une seule zone alimentée : le coût est nul aujourd'hui et évite une migration si l'export arrive. |
| 15 | Multi-langue / multi-devise | **Euro, français** | Aucune i18n en V1. |
| 17 | Remise sur le transport | **Non** | `appliesToTransport = false` par défaut. Le champ reste paramétrable. |
| 20 | Taux de TVA | **20 %** | Valeur par défaut dans `BrandingSettings`, modifiable en administration. |
| 21 | Dimension minimale de découpe | **60 cm** | Borne basse sur la longueur **et** la largeur. Voir #5 : la borne **haute** manque toujours. |
| 22 | Validité du devis | **1 mois** | `quoteValidityDays = 30`. |
| 23 | E-mails transactionnels | **Brevo** | Remplace Resend/Postmark dans la stack. API Brevo côté serveur, clé en variable d'environnement. Trois gabarits : vérification, compte approuvé, compte refusé. |
| 27 | Nouveau critère de choix | **Ajouter « type de poste de travail »** | Voir §2 : l'information est dans le catalogue, et c'est même son axe principal. |

## 2. Points réglés par le catalogue

### 2.1 L'axe de choix n'est pas l'environnement, c'est le poste de travail

**Mon hypothèse de départ était fausse.** J'avais déduit un axe *sec / humide /
agroalimentaire* de la note vocale. Le catalogue est organisé tout autrement — chaque
page porte un **type de poste de travail** en titre :

| Type de poste | Modèles | Réf. |
| --- | --- | --- |
| **Fixe** | Evermat MB, Evermat Stand | `10104`, `10101` |
| **Mobile** | Evermat Walk, Evermat ML | `10103`, `10105` |
| **Pivotant** | Evermat Turn | `10102` |
| **Spécifique** (métallurgie) | Evermat NBR, Evermat SBR | `20101NBR`, `20101SBR` |
| **Milieu humide** | Saniflex SBR, Saniflex NBR | `20102SBR`, `20102NBR` |

Correction importante : **NBR et SBR ne sont pas des tapis « milieu humide »**, contrairement
à ce que j'avais supposé. Ce sont les tapis de **poste spécifique** — industrie
métallurgique, résistance aux huiles, aux copeaux de métal et aux perles de soudure.
Le milieu humide, agroalimentaire compris, c'est la gamme **Saniflex** (`20102`).

Le configurateur doit donc demander **le type de poste de travail** en étape 1, pas
l'environnement. C'est aussi le vocabulaire du client : Ergosanté écrit « postes
d'usinage », pas « environnement sec ».

### 2.2 La préconisation devient évidente

Les descriptions du catalogue permettent de recommander sans deviner :

| Modèle | Usage décrit au catalogue |
| --- | --- |
| **MB** | « postes d'assemblage, d'emballage, de préparation de commande, **aux machines outils** » |
| **Stand** | « tous types de postes de travail statiques » |
| **Walk** | « postes mobiles nécessitant des déplacements fréquents », résistance à l'abrasion |
| **ML** | « confort optimal, entretien facile » |
| **Turn** | « mouvements rotatifs fréquents » |
| **NBR** | « résistant aux huiles et aux copeaux de métal », métallurgie |
| **SBR** | « copeaux de métal et perles de soudure », métallurgie |
| **Saniflex NBR** | polyvalent, nitrile, « milieux humides et huiles » |
| **Saniflex SBR** | « milieu humide de type **agroalimentaire** », transformation des métaux et soudage |

Sur la demande Ergosanté — « postes d'usinage » — la préconisation est **`10104`
Evermat MB**, seul modèle dont la description mentionne les machines outils.

### 2.3 Données produit à charger

| Réf. | Modèle | Poste | Épaisseur | Couleur | Format standard | Options |
| --- | --- | --- | --- | --- | --- | --- |
| `10101` | Stand | Fixe | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD |
| `10104` | MB | Fixe | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD |
| `10103` | Walk | Mobile | 13 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD |
| `10105` | ML | Mobile | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD |
| `10102` | Turn | Pivotant | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD |
| `20101NBR` | NBR | Spécifique | 14 mm | Noir RAL 9005 | 65 × 95 | **chant seul** |
| `20101SBR` | SBR | Spécifique | 14 mm | Noir RAL 9005 | 65 × 95 | **chant seul** |
| `20102SBR` | Saniflex SBR | Milieu humide | 13 mm | Noir RAL 9005 | 91 × 152 | **aucune** |
| `20102NBR` | Saniflex NBR | Milieu humide | 13 mm | **Rouge** | 91 × 152 | **aucune** |

Épaisseur et couleur ne figuraient pas au tarif : à ajouter au modèle `ProductFamily`
et à afficher au configurateur.

### 2.4 Confirmation de la règle du chant

Le catalogue confirme « tous modèles sauf Saniflex » : NBR et SBR portent bien le
pictogramme du chant jaune, les deux Saniflex n'affichent aucune option.

## 3. Contradictions levées

### 3.1 Variantes ESD / B1 sur NBR, SBR et Saniflex (question #16)

Le tarif et le catalogue concordaient : ces variantes n'existent pas hors de la gamme
mousse.

> ✅ **Décision : « s'il n'y a pas d'ESD, on grise. Idem pour B1. »**

Conséquence pour le configurateur : une option sans référence correspondante est
**grisée, pas masquée**. Le client voit que l'ESD et le B1 existent dans la gamme mais
ne sont pas disponibles sur le modèle qu'il a choisi — c'est ce qui l'amène à
reconsidérer son modèle plutôt qu'à appeler le service client. Un libellé au survol
explique pourquoi.

La règle se déduit des données, sans table d'exception à maintenir : l'option est
proposée si et seulement si une `ProductVariant` existe pour la combinaison demandée.
Ajouter demain une référence `20101NBRESD` au tarif suffira à activer l'option.

### 3.2 La colonne « V.A » (question #7)

> ✅ **Décision : les prix d'achat ne sont pas importés.** Ils ne sont pas précisés et
> n'ont rien à faire dans l'application.

C'est la réponse la plus solide au risque que cette colonne représentait. Une donnée
absente de la base ne peut ni transiter dans une réponse d'API, ni être sérialisée par
erreur dans un état React, ni se retrouver dans un export ou une sauvegarde. Le champ
`costValue` disparaît du modèle ; le contrôle à écrire n'est pas un filtre de
sérialisation mais **un contrôle d'import** — l'import ignore explicitement la colonne,
et un test le vérifie.

**Une conséquence à assumer** : l'application ne connaît plus le coût de revient, donc
elle ne peut pas empêcher une remise de vendre à perte. Le plafond de remise devient
un simple pourcentage (§5.2), sans garde-fou de marge. C'est acceptable parce que les
taux sont saisis par un administrateur, pas par le client.

*L'analyse d'anomalies de [CATALOGUE.md §5.1](CATALOGUE.md#51-quatre-lignes-hors-de-la-logique-tarifaire-de-leur-gamme)
s'appuyait sur cette colonne. Elle reste valable — elle a servi au diagnostic, pas à
l'application.*

### 3.3 Format standard du Saniflex NBR

> ✅ **Décision : « non, il ne manque rien. »**

Le Saniflex NBR ne se vend qu'à la découpe. Le résolveur ne doit donc pas chercher de
format standard pour `20102NBR`, même si le catalogue mentionne 91 × 152 cm comme
dimension type. Seul `20102SBR` a une référence à la pièce (`20102SBRU`).

## 4. Réponses complétées

| # | Question | **Décision** | Détail |
| --- | --- | --- | --- |
| 4 | Poids manquants | **Valeurs calculées validées** | `20101SBRU` = **5,87 kg** (0,6175 m² × 9,5), `20102SBRU` = **11,07 kg** (1,3832 m² × 8). Reste `CHAN01`, voir §6. |
| 5 | Bornes de découpe | **Minimum 60 cm, pas de longueur maximale** | Borne basse sur les deux côtés. La largeur maximale reste à confirmer, voir §6. |
| 27 | Devis de recette | *(en attente)* | Le devis réellement établi pour Ergosanté reste le meilleur test du moteur. Idéalement 5 à 10 devis passés couvrant plusieurs gammes, options et tranches de transport. |

## 5. Propositions en attente de validation

### 5.1 Rôle commercial en V1 (question #13) — *proposition : non*

Avec la validation manuelle des comptes (#11), quelqu'un doit déjà approuver les
inscriptions : l'administrateur suffit. Un troisième rôle ajoute de la complexité
d'autorisation pour un bénéfice nul tant qu'une seule personne gère l'outil. Le champ
`role` reste une énumération, donc `COMMERCIAL` s'ajoutera sans migration lourde.

### 5.2 Plafond de remise (question #18) — *proposition : plafond en pourcentage*

Plafond paramétrable, **30 %** par défaut. Au-delà, l'enregistrement du taux demande
une confirmation explicite.

Le garde-fou de marge que j'envisageais initialement n'est plus possible : les prix
d'achat n'étant pas importés (§3.2), l'application ne connaît pas le coût de revient
et ne peut pas refuser une vente à perte. Le plafond en pourcentage est donc la seule
barrière — acceptable parce que les taux sont saisis par un administrateur, pas par le
client.

### 5.3 Règle d'arrondi (question #19) — *proposition : arrondi en fin de ligne*

1. Calcul de chaque ligne en pleine précision, **arrondi au centime en fin de ligne**.
2. Sous-total = somme exacte des lignes arrondies.
3. Remise et transport arrondis au centime.
4. TVA calculée sur le total HT arrondi, puis arrondie au centime.

C'est la convention de facturation française usuelle, et celle qui rend le PDF
vérifiable à la calculette par le client — un total qui ne retombe pas sur la somme
des lignes génère des appels au service client.

### 5.4 Bibliothèque PDF (question #24) — *proposition : `@react-pdf/renderer`*

Rendu serveur en Node, sans navigateur sans tête. Sur Render, c'est l'argument
décisif : une solution HTML → PDF (Puppeteer, Playwright) impose d'embarquer Chromium,
soit plusieurs centaines de Mo d'image et un pic mémoire à chaque génération, pour un
document qui reste une mise en page fixe. `@react-pdf/renderer` s'écrit en composants
React, donc dans le même langage que le reste du projet, et la charte de
`BrandingSettings` s'y injecte comme des props.

*Réserve* : la fidélité typographique y est moins fine qu'en HTML. Si le devis doit
reproduire au pixel près un modèle graphique existant, il faudra rebasculer sur
Chromium — à dire maintenant, la migration coûte cher après.

### 5.5 Stockage des PDF (question #25) — *proposition : stockage objet S3 privé*

Le disque d'une instance Render n'est pas un stockage durable. Proposition :
**Cloudflare R2** ou **Scaleway Object Storage** (données hébergées dans l'UE),
bucket **privé**, accès par URL signée à durée courte générée à la demande.

Un bucket public exposerait les devis de tous vos clients à qui devinerait une URL :
ce sont des documents nominatifs et tarifés, donc jamais en accès direct.

### 5.6 Conservation des devis (question #26) — *proposition*

- **Devis** : conservation **5 ans** (prescription commerciale, art. L110-4 du code de
  commerce), puis suppression du PDF et anonymisation de la ligne.
- **Compte inactif** : alerte à 2 ans sans connexion, suppression à 3 ans.
- **Suppression à la demande** : depuis le compte, avec conservation des devis
  anonymisés jusqu'au terme légal.

À faire valider par votre conseil : ces durées sont des usages, pas un avis juridique.

---

## 6. Ce qui reste

Aucun de ces points ne bloque un lot. Ils peuvent se trancher en cours de route.

| Point | Détail | À quel moment |
| --- | --- | --- |
| **Poids du chant `CHAN01`** | Jamais fourni ni calculable depuis le tarif. Une bande de 5 cm dans un matériau à 5 kg/m² pèserait **0,25 kg/ml** — valeur à confirmer plutôt qu'à supposer. À défaut, la charger à zéro sous-facturerait le transport des devis comportant beaucoup de chant. | Avant L5 |
| **Largeur maximale de découpe (laize)** | « Pas de longueur max » répond à la longueur ; la largeur est une contrainte distincte, puisqu'un tapis se découpe dans un rouleau de laize finie. Modélisée comme nullable (vide = pas de limite) pour ne pas bloquer. | Avant la mise en production |
| **Référence recommandée** par type de poste | Fixe → MB et Pivotant → Turn sont acquis. Restent **Mobile** (Walk ou ML), **Spécifique** (NBR ou SBR) et **Milieu humide** (Saniflex SBR ou NBR). | Avant L4 |
| **Devis de recette** | 5 à 10 devis passés pour valider le moteur contre le chiffrage humain. | Avant L3 |
| **Validation des propositions §5** | Rôle commercial, plafond de remise, arrondi, PDF, stockage, RGPD. | Au fil des lots |

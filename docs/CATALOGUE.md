# Analyse du tarif source (famille TAPISEVE)

Analyse croisée de l'extrait tarifaire (48 références, barème de transport France),
du **catalogue EVERMAT / EVERTECH SAS** (8 pages) et d'une demande client réelle
servant de cas de recette.

Ce document sert deux objectifs : cadrer le **modèle de données** du catalogue
(§1 à §4), et signaler les **incohérences tarifaires** relevées dans le fichier
source (§5), qu'il vaut mieux corriger avant de les importer en base.

---

## 1. Structure du catalogue

### 1.1 L'axe du catalogue est le type de poste de travail

Le catalogue n'est pas organisé par environnement mais par **type de poste de
travail** — c'est le titre de chacune de ses pages produit :

| Réf. | Modèle | Type de poste | Épaisseur | Couleur | Format standard | Options | Poids |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `10101` | Evermat Stand | **Fixe** | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD | 5 kg/m² |
| `10104` | Evermat MB | **Fixe** | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD | 5 kg/m² |
| `10103` | Evermat Walk | **Mobile** | 13 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD | 5 kg/m² |
| `10105` | Evermat ML | **Mobile** | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD | 5 kg/m² |
| `10102` | Evermat Turn | **Pivotant** | 14 mm | Gris RAL 7016 | 65 × 95 | chant, ignifuge, ESD | 5 kg/m² |
| `20101NBR` | Evermat NBR | **Spécifique** | 14 mm | Noir RAL 9005 | 65 × 95 | chant seul | 9,5 kg/m² |
| `20101SBR` | Evermat SBR | **Spécifique** | 14 mm | Noir RAL 9005 | 65 × 95 | chant seul | 9,5 kg/m² |
| `20102SBR` | Saniflex SBR | **Milieu humide** | 13 mm | Noir RAL 9005 | 91 × 152 | aucune | 8 kg/m² |
| `20102NBR` | Saniflex NBR | **Milieu humide** | 13 mm | Rouge | 91 × 152 | aucune | 8 kg/m² |
| `CHAN01` | Chant jaune 5 cm | *option* | — | Jaune | — | tous sauf Saniflex | non renseigné |

> **Correction d'une hypothèse initiale.** Avant réception du catalogue, j'avais déduit
> de la note vocale un axe *sec / humide / agroalimentaire*, et classé les NBR/SBR
> (`20101`) en « humide ». C'est faux : ce sont les tapis de **poste spécifique**,
> destinés à l'industrie métallurgique (huiles, copeaux de métal, perles de soudure).
> Le milieu humide — agroalimentaire compris — c'est la gamme **Saniflex** (`20102`).
> Le configurateur doit donc demander le type de poste, pas l'environnement.

**Usages décrits au catalogue**, qui permettent la préconisation automatique :

| Modèle | Usage |
| --- | --- |
| MB | postes d'assemblage, d'emballage, de préparation de commande, **aux machines outils** |
| Stand | tous types de postes de travail statiques |
| Walk | postes mobiles à déplacements fréquents, résistance à l'abrasion |
| ML | confort optimal, entretien facile |
| Turn | mouvements rotatifs fréquents |
| NBR | résistant aux huiles et copeaux de métal, métallurgie |
| SBR | copeaux de métal et perles de soudure, métallurgie |
| Saniflex NBR | polyvalent, nitrile, milieux humides et huiles |
| Saniflex SBR | milieu humide **agroalimentaire**, transformation des métaux et soudage |

### 1.2 Trois unités de vente

| Unité | Signification | Exemple |
| --- | --- | --- |
| `M²` | Découpe sur mesure, prix au mètre carré | `10101` Evermat Stand — 212,94 €/m² |
| `Unit.` | Format pré-coupé, prix à la pièce | `10101U` Evermat Stand 65×95 — 115,38 € |
| `M.L.` | Mètre linéaire | `CHAN01` Chant jaune — 47,25 €/ml |

Deux formats pré-coupés existent : **65 × 95 cm** sur la gamme mousse et les
NBR/SBR, **91 × 152 cm** sur le Saniflex SBR.

### 1.3 Matrice des variantes

Sur la gamme mousse, chaque modèle existe en quatre combinaisons, chacune en
découpe et en pré-coupé — soit huit références par modèle :

| | Découpe (m²) | Pré-coupé 65×95 |
| --- | --- | --- |
| Base | `10101` | `10101U` |
| B1 | `10101B1` | `10101B1U` |
| ESD | `10101ESD` | `10101ESDU` |
| B1 + ESD | `10101ESDB1` | `10101B1ESDU` |

> **Attention au nommage.** Le suffixe de la combinaison B1+ESD s'inverse selon
> l'unité : `ESDB1` en découpe, `B1ESD` + `U` en pré-coupé. L'import ne peut donc pas
> déduire les caractéristiques par simple analyse du code référence ; il faut des
> colonnes explicites `hasESD` / `hasB1`, ou une table de correspondance.

Les gammes NBR, SBR et Saniflex n'ont **ni variante ESD ni variante B1**, ce que le
tarif et le catalogue confirment l'un et l'autre : NBR et SBR n'affichent qu'un seul
pictogramme d'option (le chant jaune), les deux Saniflex n'en affichent aucun.

> ✅ **Décision** : ces options sont **grisées** au configurateur dès que le modèle
> choisi n'a pas la référence correspondante — visibles mais non sélectionnables,
> pour que le client comprenne qu'elles existent ailleurs dans la gamme.

## 2. Ce que « B1 » désigne

`B1` correspond au classement de réaction au feu **DIN 4102-1, classe B1**
(matériau difficilement inflammable). C'est la « résistance au feu / ignifuge »
évoquée dans la note de cadrage. Le libellé présenté au client devrait l'expliciter
(« Résistance au feu — classement B1 ») plutôt qu'afficher le code brut.

## 3. Barème de transport (France)

| Jusqu'à | Forfait |
| --- | --- |
| 1 kg | 20,39 € |
| 3 kg | 25,18 € |
| 5 kg | 28,17 € |
| 10 kg | 31,26 € |
| 15 kg | 34,27 € |
| 20 kg | 37,98 € |
| 25 kg | 41,91 € |
| 30 kg | 55,59 € |
| 40 kg | 88,74 € |

Ce barème **confirme l'interprétation retenue** dans le plan : le transport est un
forfait par tranche de poids, et la mention « poids au m² » de la note vocale sert à
calculer le poids total, pas un prix.

> **Le barème s'arrête à 40 kg — ce n'est pas un cas limite.** 40 kg représentent
> 8 m² de mousse Evermat, ou 4,2 m² de NBR/SBR. La demande Ergosanté ci-dessous
> pèse déjà 22 kg à elle seule, pour trois tapis. Une commande de six tapis sort du
> barème. Il faut donc une règle explicite au-delà (« nous consultons » avec
> transmission au service client, ou barème palette), sans quoi l'application
> renverra un prix faux ou rien du tout sur une part significative des devis.

> ✅ **Décision** : au-delà de 40 kg, bascule en « **nous consulter** ». Le devis ne
> s'affiche pas, la configuration est conservée en statut `A_CONSULTER` et une
> notification part vers le service client.

✅ **Décision** : livraison **France uniquement** en V1.

## 4. Format pré-coupé contre découpe : le pré-coupé est toujours moins cher

Ramené au mètre carré, le format 65 × 95 (0,6175 m²) revient systématiquement
**12 à 18 % moins cher** que la découpe équivalente :

| Modèle | Variante | Prix pièce | Équivalent €/m² | Découpe €/m² | Écart |
| --- | --- | --- | --- | --- | --- |
| Stand | base | 115,38 € | 186,85 € | 219,70 € * | −15,0 % |
| Stand | B1+ESD | 138,13 € | 223,69 € | 261,63 € | −14,5 % |
| Turn | base | 115,38 € | 186,85 € | 219,70 € | −15,0 % |
| MB | base | 105,63 € | 171,06 € | 202,15 € | −15,4 % |
| ML | base | 102,38 € | 165,80 € | 202,15 € | −18,0 % |

\* après alignement décidé en §5.1 (tarif source : 212,94 €).

**Conséquence pour le moteur de calcul** : lorsque les dimensions saisies correspondent
exactement à un format standard, le résolveur doit retenir la référence à la pièce.
Un client demandant 65 × 95 cm qui serait chiffré en découpe paierait jusqu'à 22 % de
trop. Ce n'est pas une optimisation, c'est une règle de justesse tarifaire — et un cas
de test obligatoire.

## 5. Incohérences relevées dans le fichier source

### 5.1 Quatre lignes hors de la logique tarifaire de leur gamme

> **Note.** Cette analyse s'appuie sur la colonne « V.A » du fichier source. Cette
> colonne a servi au diagnostic, mais **elle n'est pas importée dans l'application** :
> les prix d'achat n'y ont pas leur place (voir [PLAN.md §10](PLAN.md#10-sécurité-et-conformité)).

Le rapport `PRIX DE VENTE / V.A` est un coefficient quasi constant par gamme :
**1,548** sur la mousse Evermat (36 références), **1,575** sur le caoutchouc et le
chant (5 références). Quatre références de la gamme mousse sortent de ce schéma et
portent le coefficient 1,575 :

| Référence | Désignation | PV | V.A | Coef |
| --- | --- | --- | --- | --- |
| `10101` | Evermat Stand m² | 212,94 € | 135,20 € | 1,575 |
| `10102B1ESDU` | Evermat Turn B1+ESD 65×95 | 133,88 € | 85,00 € | 1,575 |
| `10104B1` | Evermat MB B1 m² | 213,26 € | 135,40 € | 1,575 |
| `10105U` | Evermat ML 65×95 | 102,38 € | 65,00 € | 1,575 |

**Une seconde méthode, indépendante, désigne exactement les mêmes quatre lignes.**
En analysant les suppléments d'option, ESD vaut partout +24,05 €/m² et B1 partout
+17,88 €/m², la combinaison valant exactement leur somme (+41,93 €/m²) — sauf sur
ces mêmes références :

| Modèle | +B1 | +ESD | +B1+ESD | Somme attendue |
| --- | --- | --- | --- | --- |
| Turn, Walk, ML | +17,88 € | +24,05 € | +41,93 € | +41,93 € ✓ |
| **Stand** | +24,64 € | +30,81 € | +48,69 € | +55,45 € ✗ |
| **MB** | **+11,11 €** | +24,05 € | +41,93 € | +35,16 € ✗ |

Deux observations concordantes :

- **`10101` (Stand m², 212,94 €)** est le seul prix de base à s'écarter de Turn et
  Walk (219,70 €), alors que ses trois variantes B1/ESD/B1+ESD sont **identiques au
  centime** à celles de Turn et Walk, et que son format pré-coupé `10101U` (115,38 €)
  est lui aussi identique. Tout le reste du tarif traite Stand, Turn et Walk comme
  un même niveau de prix.
- **`10104B1` (MB B1, 213,26 €)** est la seule différence entre MB et ML, dont les
  prix de base (202,15 €), ESD (226,20 €) et B1+ESD (244,08 €) sont par ailleurs
  identiques. La valeur attendue serait 220,03 €, celle de ML.

> ✅ **Décision : aligner les quatre lignes.**
>
> | Référence | Tarif source | Valeur retenue |
> | --- | --- | --- |
> | `10101` Stand m² | 212,94 € | **219,70 €** |
> | `10104B1` MB B1 m² | 213,26 € | **220,03 €** |
> | `10102B1ESDU` Turn B1+ESD 65×95 | 133,88 € | **138,13 €** |
> | `10105U` ML 65×95 | 102,38 € | **105,63 €** |
>
> Correction appliquée à l'import. Conserver les valeurs d'origine en commentaire dans
> le fichier de seed, pour traçabilité.

### 5.2 Gamme Saniflex : trois anomalies

| Référence | Désignation | PV | V.A | Coef | Problème |
| --- | --- | --- | --- | --- | --- |
| `20102NBR` | Saniflex NBR m² | 121,28 € | 77,00 € | 1,575 | — |
| `20102SBR` | Saniflex SBR m² | 121,28 € | 80,85 € | **1,500** | Même prix de vente que le NBR malgré un coût supérieur |
| `20102SBRU` | Saniflex SBR 91×152 | 135,14 € | 77,00 € | **1,755** | V.A identique à celle du NBR au m², incohérente pour une pièce de 1,3832 m² |

Sur `20102SBRU`, une V.A de 77,00 € pour 1,3832 m² impliquerait un coût de 55,67 €/m²,
contre 80,85 €/m² pour le même produit en découpe. La valeur semble recopiée depuis la
ligne `20102NBR`.

> ✅ **Décision : ces valeurs sont conformes, ne pas corriger.** À documenter dans
> l'import pour qu'il ne les signale pas à chaque exécution.

✅ **Le Saniflex NBR ne se vend qu'à la découpe** : l'absence de référence
`20102NBRU` au tarif est normale, rien ne manque. Le résolveur ne doit donc pas
chercher de format standard pour `20102NBR`, même si le catalogue mentionne
91 × 152 cm comme dimension type.

### 5.3 Poids manquants ou incohérents

| Référence | Poids au tarif | Valeur déduite | Remarque |
| --- | --- | --- | --- |
| `20101SBRU` | *(vide)* | 5,87 kg | 0,6175 m² × 9,5 kg/m² |
| `20102SBRU` | *(vide)* | 11,07 kg | 1,3832 m² × 8 kg/m² |
| `CHAN01` | *(vide)* | — | Poids au mètre linéaire à fournir |
| `…ESDU`, `…U` | `3,09` | 3,0875 kg | Arrondi incohérent avec les `3,0875` des lignes B1 |

**Un poids manquant n'est pas un détail cosmétique : il fausse le transport.** Le
forfait se déduit du poids total ; une référence à poids nul ferait basculer une
commande dans une tranche inférieure et sous-facturerait la livraison. L'import doit
**refuser** une référence sans poids plutôt que la charger à zéro.

L'arrondi `3,09` contre `3,0875` est sans conséquence sur une pièce, mais sur
20 pièces l'écart atteint 0,05 kg — suffisant pour changer de tranche si le total
frôle une borne. Retenir la valeur calculée, `0,6175 × poidsAuM2`, plutôt que la
valeur saisie.

> ✅ **Valeurs calculées validées** : `20101SBRU` = **5,87 kg** (arrondi à 6 kg),
> `20102SBRU` = **11,07 kg**.
>
> ⚠️ Reste `CHAN01`, dont le poids au mètre linéaire n'a jamais été fourni ni calculé.
> Une bande de 5 cm dans un matériau à 5 kg/m² pèserait **0,25 kg/ml**
> (0,05 m² × 5 kg/m²) — valeur à confirmer plutôt qu'à supposer. À défaut, la charger
> à zéro sous-facturerait le transport des devis comportant beaucoup de chant.

### 5.4 Données absentes du tarif

Le catalogue et les arbitrages du 16/09 en ont comblé la plupart :

| Donnée | Statut |
| --- | --- |
| Type de poste de travail, épaisseur, couleur, visuel | ✅ Catalogue (§1.1) |
| Délai de livraison | ✅ **2 à 3 semaines**, mention fixe sur le devis |
| Règle d'application du chant | ✅ **Périmètre complet** |
| Taux de TVA | ✅ **20 %** |
| Dimension **minimale** de découpe | ✅ **60 cm** sur chaque côté |
| Longueur **maximale** de découpe | ✅ **Aucune limite** |
| Largeur **maximale** (laize) | ⚠️ Non précisée. Contrainte distincte de la longueur : un tapis se découpe dans un rouleau de laize finie. Modélisée comme nullable — vide = pas de limite — pour ne pas bloquer le développement. |

*Note mineure* : l'extraction texte du catalogue fait apparaître une référence `10108`
sur deux pages, absente du tarif et de toute fiche produit visible. Vraisemblablement
un résidu de gabarit, mais à vérifier au moment de l'import.

## 6. Cas de recette — demande Ergosanté du 14/09/2026

Demande réelle, à rejouer comme test d'acceptation du moteur :

> Trois tapis anti-fatigue : 220 × 91 cm, 160 × 91 cm, 160 × 60 cm.
> « Postes d'usinage, sans contraintes particulières. »
> Prix, délai de livraison, et référence préconisée.

Traduction dans le configurateur : poste de travail **fixe**, aucune spécificité,
trois lignes de dimensions distinctes, découpe sur mesure.

**La préconisation est désormais déterminée par le catalogue** : « postes d'usinage »
→ poste fixe → **`10104` Evermat MB**, seul modèle dont la description mentionne
explicitement les machines outils.

| Ligne | Dimensions | Surface |
| --- | --- | --- |
| 1 | 220 × 91 cm | 2,0020 m² |
| 2 | 160 × 91 cm | 1,4560 m² |
| 3 | 160 × 60 cm | 0,9600 m² |
| | **Total** | **4,4180 m²** |

Chiffrage selon la référence retenue :

| Référence | Prix/m² | Produit | Poids | Tranche | Transport | **Total HT** |
| --- | --- | --- | --- | --- | --- | --- |
| **`10104` Evermat MB** *(préconisé)* | 202,15 € | 893,10 € | 22,09 kg | ≤ 25 kg | 41,91 € | **935,01 €** |
| `10105` Evermat ML | 202,15 € | 893,10 € | 22,09 kg | ≤ 25 kg | 41,91 € | **935,01 €** |
| `10101` Evermat Stand | 219,70 € | 970,63 € | 22,09 kg | ≤ 25 kg | 41,91 € | **1 012,54 €** |

Sur la référence préconisée : **935,01 € HT → 1 122,01 € TTC** (TVA 20 %).

Avec une remise de 10 %, non applicable au transport, sur `10104` :
`893,10 − 89,31 + 41,91 = 845,70 € HT` → **1 014,84 € TTC**.

> **Confronter ce calcul au devis réellement établi** par le service client pour
> cette demande est le meilleur test disponible du moteur : c'est la seule preuve
> que l'automatisation reproduit le chiffrage humain plutôt qu'un chiffrage
> plausible.

Cette demande illustrait les deux besoins absents du cadrage initial — un **délai** et
une **préconisation de référence**. Le catalogue règle les deux : délai fixe de 2 à
3 semaines, et préconisation par type de poste. Sans elle, le client aurait eu cinq
modèles à départager, avec 77 € d'écart entre le moins et le plus cher sur ce devis.

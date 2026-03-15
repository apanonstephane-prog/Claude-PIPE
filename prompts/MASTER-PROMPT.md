# MASTER PROMPT — Claude-PIPE
## Architecture de prompt total : nano-banana-pro · Kling 3.0

> **Principe directeur** : Un prompt juste ne décrit pas tout.
> Il pose les ancres exactes — le modèle construit le reste.
> Sur-spécifier crée des conflits internes. Sous-spécifier donne du générique.
> Le prompt optimal = densité maximale d'intention, économie maximale de mots.

---

## I. STRUCTURE UNIVERSELLE EN 7 COUCHES

```
[1. ANCRAGE]       Lieu · époque · univers narratif
[2. SUJET]         Qui/quoi · état émotionnel · micro-détail signature
[3. COMPOSITION]   Cadrage · grille · rapport sujet/fond
[4. LUMIÈRE]       Source · direction · qualité · heure exacte
[5. COULEUR]       Palette · grade · référence DP
[6. TECHNIQUE]     Caméra · optique · pellicule · profondeur de champ
[7. INTENTION]     Ce que l'image dit — en une phrase
```

**Règle des 3** : Max 3 éléments par couche. Au-delà = entropie.

---

## II. NANO-BANANA-PRO (Gemini 3 Pro Image)

### Ce que ce modèle fait mieux que tout autre
- **Texte dans l'image** : le seul modèle qui rend le texte fidèlement (panneaux, affiches, journaux, sous-titres diégétiques)
- **Instructions complexes imbriquées** : comprend les relations spatiales et temporelles
- **Cohérence multi-référence** : jusqu'à 14 images CREF simultanées
- **Identité** : préserve jusqu'à 5 visages avec fidélité
- **Édition 4K** : retouche ciblée sans toucher au reste du cadre

### Paramètres clés
```json
{
  "aspect_ratio": "16:9",        // cinéma standard
  "aspect_ratio": "2.39:1",      // scope cinemascope → utiliser 21:9
  "aspect_ratio": "9:16",        // vertical / téléphone
  "number_of_images": 1,
  "output_format": "png",
  "safety_filter_level": "block_only_high"
}
```

### Structure de prompt optimale pour nano-banana-pro

```
[SCÈNE] Description physique précise du lieu et moment.
[SUJET] Qui est là, quoi fait-il, un détail sensoriel unique.
[COMPOSITION] Cadrage + position du sujet dans la grille phi.
[LUMIÈRE] Source + direction + effet sur la matière.
[COULEUR] 3 couleurs dominantes nommées + leur rapport.
[TECHNIQUE] Caméra + objectif + stock + ouverture.
[INTENTION] Ce que l'image dit. Une phrase.
```

### Déclencheurs techniques que nano-banana-pro reconnaît
```
Caméras :
  ARRI Alexa 35 | ARRI Alexa Mini LF | RED V-RAPTOR | Sony VENICE 2
  Hasselblad X2D | Phase One IQ4 150MP | Leica M11

Objectifs :
  Zeiss Supreme Prime 21mm T1.5 | Zeiss Supreme Prime 29mm T2.0
  ARRI Signature Prime 47mm | Cooke S7/i 75mm T2.0
  Leica Summilux-M 35mm f/1.4 | Zeiss Otus 55mm f/1.4

Pellicule / Color Science :
  Kodak Vision3 250D | Kodak Vision3 500T | Fujifilm Eterna 500
  ARRI LogC3 | RED RAW IPP2 | Cineon gamma

DPs référence (déclenche le style entier) :
  Roger Deakins — Blade Runner 2049     → désaturation douce, lumière ambre, ombres profondes
  Greig Fraser — Dune                    → texture bleach-bypass, chaleur sable, ombres froides
  Emmanuel Lubezki — The Revenant        → lumière naturelle, mouvement organique, tons boisés
  Hoyte van Hoytema — Dunkirk            → bleu acier, gris chaud, lumière rasante
  Bradford Young — Arrival               → désaturation poussée, halos diffus, intériorité
  Robert Richardson — Inglourious        → lumière dure directionnelle, contrastes extrêmes
```

### Exemple de prompt nano-banana-pro niveau cinéma

```
A narrow alley in Naples at 4:47 AM. Wet cobblestones reflect neon signs:
a red laundromat sign, a yellow pharmacy cross, a blue church door.
A young woman sits on a scooter, not riding — waiting. She wears a helmet,
visor up. Her face is tired and watchful. A single cigarette burns.
The alley is empty except for a stray cat at the far end.

Phi grid composition: woman at left-third intersection.
The alley recedes to the right, drawing depth.
Neon reflections create color pools on wet stone.

Practical light only: neon signs as key. No fill.
Deep shadow on the woman's right side.
Vapor from a distant drain catches the red light.

Palette: red dominant, cold blue secondary, acid yellow accent.
Shadows lifted to dark teal. Highlights roll off to pale gold.
Skin tone warm against cold background.

Shot on ARRI Alexa Mini LF, Zeiss Supreme Prime 29mm T2.0.
Very shallow depth of field: scooter sharp, alley recedes to soft.
Color science: Greig Fraser, Dune palette inverted to urban.
4K, 2.39:1.

This image is about waiting. The city is awake but indifferent.
```

---

## III. KLING 3.0 — Vidéo 4K HDR

### Ce que Kling 3.0 fait mieux que tout
- **4K HDR natif** : vrai HDR, pas upscale
- **15 secondes** : le plus long par génération
- **Multi-shot natif** : plusieurs plans dans une seule génération
- **Audio natif** : sons d'ambiance, musique, bruitage générés avec la vidéo
- **Mouvement caméra cinématique** : le meilleur moteur de mouvement actuel
- **Cohérence de scène** : les objets, textures, lumière restent stables dans le temps

### Paramètres clés Kling 3.0
```json
{
  "duration": 10,              // 5 | 10 | 15 secondes
  "aspect_ratio": "16:9",      // 16:9 | 9:16 | 1:1
  "negative_prompt": "...",    // ce qu'on veut éviter
  "cfg_scale": 0.5,            // 0.0-1.0 : fidélité au prompt (0.5 = équilibre)
  "mode": "std" | "pro",       // std = rapide, pro = qualité max
}
```

### Structure multi-shot (15 secondes)

**Principe** : Kling 3.0 comprend les transitions narratives.
Chaque "bloc" de prompt = un plan. Les transitions doivent être écrites comme des coupes de montage.

```
FORMAT MULTI-SHOT :

OPENING SHOT (0–4s): [Description plan 1].
CUT TO (4–7s): [Description plan 2].
CUT TO (7–10s): [Description plan 3].
CLOSE ON (10–15s): [Description plan final / résolution].

CAMERA: [Mouvement dominant]
AUDIO: [Ambiance sonore]
GRADE: [Référence couleur]
```

**Exemple multi-shot 15s :**
```
OPENING WIDE SHOT (0–5s): A massive steel bridge over a foggy river at dawn.
A lone figure walks toward camera on the empty roadway, small against the structure.
Camera: slow push in from 200mm equivalent.

CUT TO (5–9s): Medium shot. The figure stops at the center of the bridge.
Hands on the railing. Looking down at the grey water.
Camera: static. Slight natural camera breathing.

CUT TO (9–12s): Extreme close-up of hands gripping cold wet steel.
Ring on the left hand. A wedding ring.
Camera: static macro.

CLOSE ON (12–15s): Wide again, the figure from behind.
The fog begins to lift. First light touches the water gold.
The figure slowly straightens. Turns to walk back.
Camera: slow crane up.

AUDIO: Wind. Distant water. No music.
GRADE: Hoyte van Hoytema — Dunkirk. Cold steel blue, warm emerging gold.
4K HDR, 16:9.
```

### Mots-clés mouvement caméra Kling 3.0

```
TRANSLATIONS :
  slow push in         → avance imperceptible vers le sujet
  pull back reveal     → recul révélant un environnement plus vaste
  dolly left / right   → mouvement latéral accompagnant l'action
  crane up             → élévation verticale, révèle l'échelle
  crane down           → descente, intimité croissante

ROTATIONS :
  slow pan left/right  → balayage horizontal, découverte
  tilt up / tilt down  → révèle hauteur (bâtiment) ou sol
  orbit around subject → cercle autour du sujet (max recommandé: 90°)

EFFETS OPTIQUES :
  rack focus from foreground to subject    → transition attention
  shallow depth of field, focus pull       → isolement progressif
  natural camera breathing                 → trépied vivant, grain organique
  handheld with intention                  → présence humaine, urgence
  locked off, completely static            → tension, observation, attente

À ÉVITER :
  "drone shot" (souvent raté)
  "360 rotation" (artifacts)
  "fast zoom" (cheap)
  trop de mouvements combinés
```

### Kling 3.0 V3 vs O3 — Choisir le bon variant

| | **V3** (`kling-3.0`) | **O3 / Omni** (`kling-3.0-omni`) |
|---|---|---|
| **Force** | Cinéma prompt-driven, mouvement caméra | Audio natif, cohérence personnage |
| **Durée max** | 15 secondes | 30 secondes |
| **Elements** | Non | Oui — `@Element1`, `@Element2`, `@Element3` |
| **Audio natif** | Limité | Oui — ambiance + voix |
| **Multi-shot** | Via prompt | Natif + personnages persistants |
| **Quand l'utiliser** | Plans cinéma purs, atmosphère | Narration avec personnages identifiés |

### Elements System (O3 uniquement) — Cohérence de personnage

**Principe** : un "Element" est un personnage verrouillé par 1 à 3 photos de référence.
Il reçoit un tag (`@Element1`) réutilisable dans tout le prompt multi-shot.
Jusqu'à 3 éléments par génération. Jusqu'à 3 photos par élément.

```typescript
// Utilisation dans MasterPromptOptions
elements: [
  {
    tag: "@Element1",
    imageUrls: ["url_photo_face.jpg", "url_photo_profil.jpg"],
    name: "Marie",
    characterOrientation: "video",  // cohérence orientée vidéo, permet 30s
  }
]

// Dans le prompt multi-shot, le tag est injecté automatiquement
// SHOT 1 (0–5s): @Element1 walks through the market...
// CLOSE ON (12–15s): @Element1 turns to camera...
```

**character_orientation** :
- `"image"` → personnage dans la même orientation que la photo → max 10s
- `"video"` → cohérence orientée vidéo, plus de liberté de mouvement → max 30s

### Mots-clés audio Kling 3.0
```
Ambiances :
  urban ambience | forest sounds | ocean waves | wind in grass
  rain on pavement | crowd murmur | industrial hum | silence

Musique :
  sparse piano score | string quartet | low drone | ambient electronic
  percussive rhythm | no music, diegetic sound only

Qualité :
  high fidelity audio | spatial audio | natural reverb
```

---

## IV. THÉORIE AVANCÉE — CE QUI FAIT LA DIFFÉRENCE

### Géométrie sacrée appliquée au cadrage

**Phi Grid (≠ règle des tiers)**
La règle des tiers divise en 3 parts égales (0.333).
Le phi grid divise selon le nombre d'or (0.618 / 0.382).
Les intersections phi sont légèrement décalées vers le centre — plus naturelles à l'œil.

```
Usage en prompt :
  "phi grid: subject at lower-right intersection"
  "golden ratio framing: face at 0.618 from left edge"
  "Fibonacci spiral: eye-line follows the curve from lower-left"
```

**Spirale de Fibonacci**
L'œil suit naturellement la spirale logarithmique.
Placer le sujet au centre de la spirale, les éléments secondaires sur ses bras.

```
Usage :
  "Fibonacci spiral composition: the subject at the eye of the curve,
   leading lines spiral outward through foreground elements"
```

**Nombre d'or en proportion**
- Cadres dans le cadre : 0.618 de la largeur totale
- Horizon : jamais au milieu, rarement au tiers, idéalement à 0.382 ou 0.618 du haut
- Sujets humains : tête à 0.618 du haut du cadre dans un portrait

### Cybernétique visuelle et perception

**Hiérarchie perceptuelle (Gestalt)**
L'œil lit dans cet ordre :
1. Contraste (clair/sombre)
2. Saturation (couleur vive)
3. Mouvement / netteté (sharpness)
4. Forme reconnaissable (visage > corps > objet)
5. Texte

En prompt : construire cette hiérarchie explicitement.
```
"Visual hierarchy: face as primary focus (sharp, warm, high contrast),
 background as secondary (slightly desaturated, soft focus),
 foreground texture as tertiary (sharp but dark)"
```

**Flux optique et attention**
Les lignes convergentes guident l'œil vers un point focal.
La profondeur de champ crée une hiérarchie d'attention.
Le mouvement oriente le regard.

```
"Leading lines: train tracks converge to vanishing point where subject stands"
"Depth of field as attention: subject in focus, everything else falling off"
"Motion vector: the crowd moves left, the protagonist moves right — visual tension"
```

**Loi de Prägnanz** : l'œil cherche la forme la plus simple.
Éviter le bruit visuel autour du sujet principal.

### Fluidité du mouvement (pour Kling 3.0)

**Analyse du mouvement de Laban** appliquée aux prompts vidéo :

| Qualité      | Laban       | En prompt                                    |
|-------------|-------------|----------------------------------------------|
| Poids léger  | Light       | "floats", "drifts", "barely touching"        |
| Poids fort   | Strong      | "presses", "anchors", "weighted"             |
| Temps soudain| Sudden      | "snaps into frame", "explosive movement"     |
| Temps soutenu| Sustained   | "slowly unfolds", "deliberate", "unhurried"  |
| Flux libre   | Free flow   | "flows naturally", "organic"                 |
| Flux contrôlé| Bound flow  | "controlled", "precise", "restrained"        |

**Inertie et physique dans les prompts vidéo :**
```
"The camera decelerates as it approaches the subject — ease out"
"Fabric catches air as she turns, momentum carried through"
"Dust rises slowly in shafts of light — suspended, weightless"
"The door swings with physical weight, slight overshoot and settle"
```

### Color Science 300M — Ce qui distingue un vrai grade

**Le problème du teal-orange** : c'est le grade paresseux des années 2010.
Ça existe parce qu'il fait ressortir les peaux (orange) sur l'environnement (teal).
Mais un grade de cinéma à 300M fait quelque chose de plus fin :

```
Grade cinéma professionnel :
  Shadows → lift vers dark green-brown (pas pur noir, pas teal vif)
  Midtones → légèrement chauds pour les peaux (2800-3200K effectif)
  Highlights → roll-off vers cream/gold (jamais clipper, jamais blanc pur)
  Saturation → sélective : peaux saturées, ciel/béton désaturé
  Contrast → S-curve douce : plus de détail dans les ombres et hautes lumières

Références précises :
  Blade Runner 2049 (Deakins)
    → shadows: profond bleu-vert, midtones: ambre chaud, highlights: or pâle
    → skin: protégé, légèrement orange sur fond froid
    → grain: présent à 800 ISO simulé

  Dune (Greig Fraser)
    → bleach bypass partiel : désaturation sélective, texture renforcée
    → sable: or chaud, ciel: bleu métallique froid
    → contraste dur mais highlights never blown

  The Revenant (Lubezki)
    → naturel dominant : lumière de source réelle
    → shadows: warm brown (intérieur pelisse) / cool blue (extérieur neige)
    → aucun artifice : ce qui existe dans la scène crée le grade

  Arrival (Bradford Young)
    → désaturation poussée : presque monochrome sauf quelques accents
    → halos sur les lumières (T2.0 wide open)
    → isolation : tout pour forcer l'intériorité
```

**En prompt :**
```
"Color grade: Roger Deakins, Blade Runner 2049.
 Deep blue-green shadows, warm amber midtones, pale gold highlights.
 Skin tones protected and warm. Slight grain throughout."

"Color science: Greig Fraser, Dune.
 Bleach bypass texture. Sand warmth in highlights, cold blue in shadows.
 No desaturation of skin. Maximum texture in fabric and surface detail."
```

---

## V. SYNERGIES — COMMENT COMBINER LES COUCHES

### Règle de cohérence interne
Chaque couche doit parler le même langage émotionnel.

```
❌ INCOHÉRENT :
  "Wide panoramic landscape, desaturated, contemplative — shot at f/1.4 with bokeh"
  (Le paysage panoramique demande profondeur / le bokeh détruit la profondeur)

✓ COHÉRENT :
  "Wide panoramic landscape, desaturated, contemplative — shot at 24mm f/8,
   everything from foreground rock to horizon sharp, grain in the sky"
```

### Superposition nano-banana-pro + Kling 3.0

**Workflow recommandé :**
1. **nano-banana-pro** → image master : plan-clé, CREF si personnage, grade établi
2. **Kling 3.0** → vidéo à partir de l'image (image-to-video mode) avec le même grade
3. Cohérence garantie : même lumière, même palette, même sujet

```bash
# Générer l'image master avec nano-banana-pro
node generate-images.js \
  --prompt "..." \
  --model nano-banana-pro \
  --style cinematic

# Utiliser comme première frame pour Kling 3.0
node generate-images.js \
  --prompt "..." \
  --model kling-3.0 \
  --type video \
  --image output/master-frame.png \
  --duration 10
```

### Le détail signature
Dans tout prompt, inclure **un détail sensoriel unique et précis** qui ancre le réel.
Pas "une vieille voiture" — "une Peugeot 404 bordeaux avec une roue de secours rouillée à l'arrière".
Pas "des arbres" — "un eucalyptus dont l'écorce se décolle en spirales blanches".
Ce détail dit au modèle : *ce monde a une texture précise. Reste dans cette précision.*

---

## VI. TEMPLATES RAPIDES

### Template IMAGE cinéma (nano-banana-pro)
```
[LIEU + HEURE EXACTE]. [SUJET + ACTION + DÉTAIL SIGNATURE].
[COMPOSITION : grille phi ou spirale + position sujet].
[LUMIÈRE : source + direction + effet matière].
[3 COULEURS dominantes + grade DP référencé].
Shot on [CAMÉRA], [OBJECTIF] [OUVERTURE].
[INTENTION en une phrase].
4K, [RATIO].
```

### Template VIDÉO courte 5–10s (Kling 3.0)
```
[DESCRIPTION SCÈNE]. [SUJET + ÉTAT].
Camera: [MOUVEMENT PRÉCIS] — [QUALITÉ DU MOUVEMENT].
[LUMIÈRE + GRADE].
Audio: [AMBIANCE SONORE].
[INTENTION].
4K HDR, 16:9.
```

### Template VIDÉO multi-shot 15s (Kling 3.0)
```
SHOT 1 (0–Xs): [PLAN LARGE / ÉTABLISSEMENT]. Camera: [MOUVEMENT].
CUT TO (Xs–Ys): [PLAN MOYEN / ACTION]. Camera: [MOUVEMENT].
CUT TO (Ys–Zs): [INSERT / DÉTAIL]. Camera: static or [MICRO-MOUVEMENT].
CLOSE ON (Zs–15s): [RÉSOLUTION / PLAN ÉMOTIONNEL]. Camera: [MOUVEMENT].
AUDIO: [AMBIANCE]. GRADE: [RÉFÉRENCE DP]. 4K HDR.
```

### Template IMAGE avec texte (nano-banana-pro — force unique)
```
[SCÈNE]. [OBJET AVEC TEXTE] displays the text "[TEXTE EXACT]" in [STYLE DE TYPOGRAPHIE].
[COMPOSITION + LUMIÈRE].
The text must be legible, [TAILLE RELATIVE], [COULEUR DU TEXTE] on [FOND].
[GRADE + TECHNIQUE].
```

---

## VII. ANTI-PATTERNS — CE QUI CASSE LES PROMPTS

### Sur-spécification
```
❌ "extremely detailed, hyper-realistic, ultra-sharp, 8K, 16K, perfect,
    stunning, breathtaking, award-winning, masterpiece"
    → Mots vides. Le modèle les ignore ou les traite comme du bruit.

✓ "Kodak Vision3 250D, 4K" — précis, technique, actionnable
```

### Contradictions internes
```
❌ "minimalist composition with rich detailed background"
❌ "natural documentary style, shot on RED V-RAPTOR with cinema lenses"
❌ "intimate close-up, wide angle lens"
```

### Demander le résultat au lieu de la cause
```
❌ "beautiful, emotional, cinematic"   → états résultants, pas causes
✓ "golden hour, face lit from below, Roger Deakins"  → causes du beau
```

### Négatifs inutiles pour nano-banana-pro
nano-banana-pro comprend les instructions positives complexes.
Les negative_prompts sont moins nécessaires que pour Flux/SDXL.
Utiliser seulement pour exclure des éléments très spécifiques.

---

## VIII. RÉFÉRENCE RAPIDE — MODÈLE À CHOISIR

| Besoin | Modèle |
|--------|--------|
| Texte dans l'image | **nano-banana-pro** |
| CREF multi-référence (jusqu'à 14 images) | **nano-banana-pro** |
| 4K photorealistic rapide | **nano-banana-2** |
| Image cinéma complexe, instructions imbriquées | **nano-banana-pro** |
| Video atmosphérique courte (5s) | **kling-3.0** (V3) |
| Séquence narrative multi-plan (15s), prompt-driven | **kling-3.0** (V3) |
| Scène avec personnage identifié persistant | **kling-3.0-omni** (O3) |
| Narration multi-shot avec audio natif (jusqu'à 30s) | **kling-3.0-omni** (O3) |
| Image rapide / test | **flux-schnell** |
| Image qualité sans CREF | **flux-dev** |

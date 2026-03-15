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

### Paramètres clés Kling 3.0 (API confirmés)
```json
{
  "prompt": "...",              // max 2500 caractères
  "duration": 10,              // 3 à 15 secondes
  "aspect_ratio": "16:9",      // 16:9 | 9:16 | 1:1
  "negative_prompt": "...",    // supporté (contrairement à nano-banana-pro)
  "cfg_scale": 0.5,            // 0.0-1.0 : faible=stylisé, moyen=cinéma, élevé=produit exact
  "mode": "std" | "pro",       // std = 720p, pro = 1080p
  "multi_shots": true,         // activer le multi-shot (jusqu'à 6 plans)
  "sound": true,               // activer l'audio natif (V3) / "generate_audio" (Omni)
  "start_image": "url",        // première frame (image-to-video)
  "end_image": "url",          // dernière frame — INCOMPATIBLE avec multi_shots
}
```

**Résolution réelle — clarity importante :**
- Via API (Replicate) : **1080p max** (mode=`pro`) — pas de 4K natif
- Sur la plateforme officielle Kling avec abonnement Pro : 4K disponible
- "4K HDR" dans les prompts reste pertinent comme directive stylistique

**Longueur optimale du prompt Kling 3.0 : 80–150 mots.**
Au-delà : les instructions conflictuelles sont moyennées, pas exécutées.

**Philosophie** : écrire comme un réalisateur, pas comme un photographe.
Le prompt décrit un plan en cours de tournage, pas une image statique.

### Structure multi-shot (15 secondes)

**Specs réelles (confirmées API) :**
- Max 6 plans distincts dans un clip de 15s
- Durée min recommandée par plan : 2s
- Paramètre API à activer : `multi_shots: true`
- Continuité spatiale maintenue automatiquement entre les plans

**CONTRAINTE CRITIQUE** : `multi_shots` est **incompatible avec `end_image`**.
Si une dernière frame est fournie, le multi-shot est silencieusement désactivé.
Choisir : soit multi-shot, soit contrôle début+fin.

**Workflow recommandé** : itérer du simple au complexe.
Commencer par un plan unique → valider le style et la physique → passer au multi-shot.
Ne pas commencer directement à 6 plans.

**Structure narrative** : hook (large, établissement) → milieu (action, mouvement) → payoff (gros plan, révélation)

**Règle de rythme** : 4–6 plans pour 10–15s = sweet spot.
6 plans en moins de 10s = précipité. 2 plans sur 15s = lent.

**Deux modes disponibles :**
- **Smart Storyboard** : l'IA découpe automatiquement le prompt narratif
- **Custom Storyboard** : tu spécifies chaque plan manuellement (recommandé)

```
FORMAT MULTI-SHOT (Custom Storyboard) :

Master Prompt: [Contexte narratif global + description personnage]

Shot 1 ([Xs]): [Type caméra], [sujet], [action]
Shot 2 ([Ys]): [Angle caméra], [action], [ambiance/lumière]
Shot 3 ([Zs]): [Mouvement caméra], [continuation/réaction]
Shot 4 ([Ws]): [Plan de clôture], [résolution émotionnelle]

AUDIO: [Ambiance] GRADE: [Référence DP] 4K HDR.
```

**Dialogue tagging (lipsync multi-personnage) :**
```
@character_label [Langue/accent] "Texte du dialogue."
[Speaker: Nom du personnage] "Dialogue"

// Avec timing précis :
Beat 0-5s: [Personnage A marche. Bruits de pas sur parquet.]
Beat 5s: [Porte claque. Silence ambiant.]
Beat 7s: [Marie, voix basse]: "Il faut qu'on parle."
Beat 10s: [Paul, défensif]: "De quoi exactement ?"
```

**Voice IDs (Omni uniquement) :**
- Extraire des voix de référence comme `<<<voice_1>>>` et `<<<voice_2>>>`
- Max 2 voix par tâche
- Référencer dans le prompt : `[<<<voice_1>>>]: "Dialogue"`

**Règles lipsync :**
- 1–2 phrases max par plan
- Phrases courtes = lipsync plus précis
- Labels explicites, jamais pronoms (il/elle)
- Spécifier langue et accent si non-anglais

**Alignement BPM (musique) :**
```
Durée d'un plan = 60 / BPM × nombre_de_temps
Ex: 120 BPM, 4 temps → 60/120 × 4 = 2s par plan
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

### Les 4 règles d'or (communauté Kling 3.0)

**1. Motion verbs = signal le plus sensible**
```
❌ "moves", "goes", "walks toward"   → générique
✓  "dolly push", "whip-pan", "shoulder-cam drift", "crash zoom", "snap focus"
```

**2. Texture = crédibilité physique**
Inclure au moins un détail micro-physique par plan :
grain pellicule · flares optiques · reflets · brillance tissu · condensation · fumée · sueur · vapeur de souffle
→ Signaux tactiles qui font la différence entre rendu physique et CGI-lisse.

**3. Décrire le flux temporel, pas l'état**
```
❌ "A woman stands in a field at sunset"   → image figée
✓  "Beginning: woman distant in field. Camera slowly drifts forward.
    End: tight on her face as light fades behind her."
```

**4. Établir en premier, maintenir ensuite**
Définir personnages, environnement, objets-clés dans les premières lignes.
Kling maintient ces éléments tout au long de la vidéo une fois établis.

### Principe "camera first" — Kling 3.0

**Mettre le mouvement caméra EN PREMIER dans le prompt.**
Kling pondère les premiers mots-clés de mouvement plus fortement que les suivants.

```
✓  "Handheld shoulder-cam with subtle drift — a woman walks through rain"
❌ "A woman walks through rain, handheld shoulder-cam with subtle drift"
```

**Max 2 techniques de mouvement par plan.**
```
❌ "Dutch angle whip pan with rack focus during crane shot"  → résultat confus
✓  "Low crane shot arriving at eye level"
✓  "Dolly zoom (Vertigo effect) — subject static, background compresses"
```

**Kling V3 supporte maintenant le dolly zoom / Vertigo effect** — V2.1 pro échouait sur ce mouvement.

### Principe end-state caméra — la règle la plus importante pour Kling 3.0

> Décrire **où la caméra arrive**, pas ce qu'elle fait.

```
❌ "camera moves toward the face"
✓  "camera arrives at medium close-up on face"

❌ "dolly in slowly"
✓  "slow dolly-in arriving at tight over-the-shoulder"

❌ "crane down"
✓  "crane down to eye level, arriving just as subject looks up"
```

**Pourquoi** : le modèle vidéo génère frame-par-frame. L'end-state lui donne la cible à atteindre. Le mouvement est déduit. Sans end-state, le mouvement s'arrête arbitrairement.

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

**Trois systèmes — du plus connu au plus fin**

| Système | Division | Force | Usage |
|---------|----------|-------|-------|
| Règle des tiers | 3 parts égales (0.333) | Baseline, tous les modèles la connaissent | Point de départ |
| Phi Grid | Rapport doré (0.618/0.382) | Intersections plus vers le centre, plus naturelles | Portraits, sujets humains |
| Dynamic Symmetry | Diagonales root-rectangle (√2, √3, √5, φ) | Énergie directionnelle, tension narrative | Plans cinéma, action |

**Phi Grid (≠ règle des tiers)**
Les intersections phi sont légèrement décalées vers le centre — plus d'espace environnemental, sujet mieux ancré.

```
"phi grid: subject at lower-right intersection"
"golden ratio framing: face at 0.618 from left edge"
"divine proportion framing, harmonic armature"
```

**Spirale de Fibonacci**
L'œil suit naturellement la spirale logarithmique.
Sujet au centre de la spirale, éléments secondaires sur ses bras extérieurs.

```
"Fibonacci spiral composition: the subject at the eye of the curve,
 leading lines spiral outward through foreground elements"
"logarithmic spiral subject placement"
```

**Diagonales de Dynamic Symmetry — l'énergie directionnelle**

> C'est ce que les grands DP utilisent sans le nommer explicitement.

- **Diagonale baroque** (bas-gauche → haut-droit) : direction naturelle de lecture, mouvement en avant, optimisme, progression
- **Diagonale sinistre** (haut-gauche → bas-droit) : contre-courant, descente, malaise, menace

```
Plan de héros qui avance : "baroque diagonal composition — subject moving
 from lower-left to upper-right, sense of forward momentum"

Plan de chute/tension : "sinister diagonal — compositional descent
 from upper-left to lower-right, implicit unease"

Tension maximale : "reciprocal diagonal tension — two competing diagonals
 creating visual conflict at center intersection"
```

**Nombre d'or en proportion**
- Cadres dans le cadre : 0.618 de la largeur totale
- Horizon : idéalement à 0.382 ou 0.618 du haut (jamais au milieu)
- Sujets humains : tête à 0.618 du haut dans un portrait

### Cybernétique visuelle et perception

**Hiérarchie perceptuelle (Gestalt)**
L'œil lit dans cet ordre :
1. Contraste lumineux (clair/sombre)
2. Saturation (couleur vive dans champ neutre)
3. Netteté / mouvement
4. Forme reconnaissable (visage > corps > objet)
5. Texte

En prompt : construire cette hiérarchie explicitement.
```
"Visual hierarchy: face as primary focus (sharp, warm, high contrast),
 background as secondary (slightly desaturated, soft focus),
 foreground texture as tertiary (sharp but dark)"
```

**Circuit visuel fermé (Wiener / cybernétique)**
Une composition réussie crée une boucle de feedback : l'œil entre par le point de plus haute saillance, suit les lignes de continuité, atteint les points focaux secondaires, et *revient* au point d'entrée. Une composition ratée laisse l'œil sortir du cadre sans retour.

Encoder un circuit fermé :
```
"Foreground figure as entry point — leading line across midground —
 horizon as terminus — atmospheric haze drawing gaze back to foreground"

"Eye enters on bright highlight top-right, follows diagonal down to face,
 leading line of arm points to background detail, soft vignette returns attention"
```

**Flux optique et attention**
```
"Leading lines: train tracks converge to vanishing point where subject stands"
"Depth of field as attention director: subject sharp, world falling off"
"Motion vector: crowd moves left, protagonist moves right — visual tension"
"Smooth laminar flow — coherent directional motion across frame"
"Radial outward expansion from center subject"
```

**Loi de Prägnanz** : l'œil cherche la forme la plus simple.
Éviter le bruit visuel autour du sujet principal. "Single focal point, clean figure-ground separation."

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
Grade cinéma professionnel — architecture en 5 points :

  1. Shadow lift : blacks levés vers dark chocolate-brown (jamais teal pur)
                   → "lifted blacks", "matte black aesthetic", "detail retained in shadow"

  2. Highlight roll-off : compression vers cream/gold (jamais clipper)
                          → "soft highlight roll-off", "Kodak 2383 print look",
                             "creamy highlight transition", "no blown highlights"

  3. Skin tone protection : canal orange calibré sur fréquence peau (≈ 20° hue)
                            → "natural skin tones preserved", "warm golden skin frequency"

  4. Saturation sélective : midtones saturés, ombres/hautes lumières désaturées
                            → jamais boost uniforme

  5. Contrast en log-space : roll-off organique
                             → "log-curve contrast", "photochemical emulation"

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

  Mad Max: Fury Road (John Seale / Eric Whipp grade)
    → saturation roman graphique : primaires riches, pas de bleach bypass
    → surexposition 2 stops reprise au grade : texture préservée dans les hautes lumières
    → cobalt profond vs ambre désert — contraste maximal ciel/sol
    → peaux neutres sur fond saturé (inverse du Deakins)
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

### Template VIDÉO courte 5–10s (Kling 3.0) — Framework SCALE
```
S — Shot:      [Type caméra + mouvement + end-state]
C — Character: [Sujet + apparence + état émotionnel]
A — Action:    [Timeline : d'abord X, puis Y, finalement Z]
L — Location:  [Lieu précis + conditions lumière]
E — Extra:     [Grade couleur. Audio. Negative prompt si nécessaire.]

4K HDR, 16:9, [durée]s.
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

### Minimum Effective Dose — la table de référence

> Au-delà des seuils ci-dessous = entropie. Les attracteurs sémantiques se battent.

| Paramètre | Dose minimale efficace | Seuil de sur-spécification |
|-----------|------------------------|---------------------------|
| Composition | 1 système + 1 point focal | Plus de 2 systèmes simultanés |
| Color grade | 1 référence film + 2 termes techniques | Plus de 3 directives couleur |
| Mouvement | 1 qualité Laban + 1 mouvement caméra | Plus de 2 mouvements simultanés |
| Atmosphère | 1 condition lumière + 1 élément atmosphérique | Plus de 3 effets simultanés |
| Référence style | 1 film ou DP | Plus de 2 références nommées |

**Corollaire** : quand tu nommes correctement une référence, tu as le package entier implicitement.
`"Roger Deakins lighting"` → sources pratiques, lumière en mouvement, clair-obscur, registre d'exposition bas.
Pas besoin d'énumérer. Ajoute seulement les **déviations** par rapport à la référence.

### Entropy Kill List — combinaisons interdites

Ces paires créent des conflits internes que les modèles ne peuvent pas résoudre :

```
❌ "cinematic ARRI Alexa" + "hyperrealistic 8K ultra-sharp"
   → log-based organique vs clinique digital — ils se combattent

❌ "minimalist composition" + plus de 4 éléments décrits dans le même cadre

❌ "natural documentary lighting" + "dramatic studio lighting with rim highlights"
   → deux philosophies lumière opposées dans le même plan

❌ "sustained slow movement" (Laban) + "explosive high-energy kinetic"
   → qualités d'effort contradictoires

❌ Deux références DP nommées pour le même plan
   → leurs philosophies visuelles font la moyenne → boue

❌ "sacred geometry" + "Wes Anderson symmetry"
   → mathématique organique vs design graphique — confusion visuelle

❌ "extremely detailed, ultra-sharp" + "film grain, organic texture"
   → digital vs analogique — signal conflictuel
```

### Mots vides — à ne jamais utiliser
```
❌ "extremely detailed" | "ultra-sharp" | "8K" | "16K"
❌ "perfect" | "stunning" | "breathtaking" | "award-winning" | "masterpiece"
❌ "beautiful" | "gorgeous" | "amazing"
   → États résultants, pas causes. Remplacer par les causes :
✓ "Kodak Vision3 grain at 800 ISO" → grain réel
✓ "Zeiss Supreme Prime T2.0" → netteté optique réelle
✓ "golden hour, Deakins" → beau réel
```

### Autres contradictions classiques
```
❌ "minimalist composition with rich detailed background"
❌ "intimate close-up, wide angle lens"   → contradiction physique
❌ "natural documentary style, shot on RED V-RAPTOR with cinema lenses"
   → l'esthétique contredit le choix technique
```

### nano-banana-pro : pas de negative_prompt — jamais

**CRITIQUE** : nano-banana-pro est un modèle "Thinking" (raisonnement avant génération), pas un modèle de diffusion. **Le paramètre `negative_prompt` n'existe pas.** Il sera ignoré silencieusement.

Stratégie de remplacement :
```
❌ negative_prompt: "blurry, overexposed, ugly"
✓  Dans le prompt: "perfectly sharp focus, controlled exposure, elegant composition"
   → Formuler ce qu'on veut, pas ce qu'on ne veut pas
```

### nano-banana-pro : step-back prompting (avancé)

Pour les scènes complexes, demander d'abord au modèle de planifier :
```
"Before creating the image, explain how you would approach designing
 a scene of [X] with [Y constraints]..."
```
Le modèle raisonne à voix haute — la génération suivante est plus cohérente.

### nano-banana-pro : commencer par un verbe fort
```
✓ "Generate a cinematic wide shot of..."
✓ "Create a photorealistic portrait of..."
✓ "Design a poster for..."
✓ "Edit the scene to add..."
```
Déclarer l'opération principale en premier oriente toute la suite du raisonnement.

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

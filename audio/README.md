# Audio — Sons des projets

Dépose ici les fichiers audio à utiliser dans le pipeline (lipsync, musique, voix off).

## Structure

```
audio/
├── <nom-du-projet>/
│   ├── voix.mp3          # voix off ou dialogue
│   ├── musique.mp3       # bande son
│   └── ...
└── exemple-projet/
    └── .gitkeep
```

## Formats acceptés

| Format | Usage |
|--------|-------|
| `.mp3` | musique, voix — compatible Replicate |
| `.wav` | qualité max pour lipsync |
| `.m4a` | export iPhone direct |

## Taille

- Fichiers **< 50 MB** : commit direct
- Fichiers **> 50 MB** : utiliser Git LFS (voir ci-dessous)

```bash
git lfs track "audio/**/*.wav"
git lfs track "audio/**/*.mp3"
```

## Utiliser un fichier dans le pipeline

```bash
# Lipsync via Replicate
node lipsync-scenes.js --audio audio/mon-projet/voix.mp3 --video output/scene.mp4

# Ou en passant l'URL GitHub raw :
# https://raw.githubusercontent.com/<user>/Claude-PIPE/main/audio/mon-projet/voix.mp3
```

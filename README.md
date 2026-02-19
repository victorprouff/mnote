# mnote

Éditeur de notes Markdown en mode **Live Preview** — comme Obsidian. Construit avec Tauri 2, Svelte 5 et CodeMirror 6.

## Fonctionnalités

- **Live Preview** : le markdown est rendu inline pendant la frappe. Poser le curseur sur une ligne révèle la syntaxe brute pour l'édition.
  - Titres H1–H6 (taille réelle, sans le `#`)
  - Gras `**text**`, italique `*text*`, code inline `` `code` ``
  - Liens `[label](url)` → affiche uniquement le label en bleu
  - Images `![alt](url)` → affiche l'alt text
  - Listes non ordonnées `- item` → remplacées par `•`
  - Listes ordonnées `1. item` → numéro visible, atténué
  - Règles horizontales `---` → ligne HR
  - Blockquotes `> texte` → barre bleue à gauche
- **Auto-save** : sauvegarde automatique 1 s après la dernière frappe, indicateur `●` dans la toolbar si non sauvegardé
- **Sidebar** : arborescence du vault, uniquement les fichiers `.md`
- **Vault persistant** : le chemin du vault est mémorisé entre les sessions

## Stack

| Couche | Technologie |
|--------|------------|
| Shell natif | Tauri 2 (Rust) |
| UI | Svelte 5 (runes) |
| Éditeur | CodeMirror 6 |
| Parsing markdown | `@lezer/markdown` (via `@codemirror/lang-markdown`) |
| Thème éditeur | `@codemirror/theme-one-dark` |
| Rendu markdown (Preview) | `markdown-it` (composant conservé, non affiché) |

## Structure

```
src/
  App.svelte              — état global (vault, fichier, contenu, dirty)
  components/
    Sidebar.svelte        — arborescence des fichiers
    Editor.svelte         — CodeMirror 6 + live preview
    Preview.svelte        — rendu HTML pur (non utilisé en mode live preview)
  lib/
    tauri.ts              — wrappers invoke() Tauri
    live-preview.ts       — ViewPlugin CodeMirror : décorations live preview

src-tauri/src/
  commands.rs             — read_directory, read_file, save_file, vault config
  lib.rs                  — enregistrement des commandes Tauri
```

## Développement

```bash
npm install
npm run tauri dev      # dev avec hot-reload
npm run build          # build frontend seul
cargo check            # vérification Rust (depuis src-tauri/)
```

## Architecture du Live Preview

Le plugin `live-preview.ts` est un `ViewPlugin` CodeMirror qui :

1. À chaque changement de document, de sélection ou de viewport, parcourt le syntax tree Lezer dans la fenêtre visible
2. Pour chaque nœud markdown **dont la ligne ne contient pas le curseur** :
   - Ajoute un `Decoration.replace({})` sur les marqueurs syntaxiques (les cache)
   - Ajoute un `Decoration.mark({ class })` sur le contenu (l'habille en CSS)
3. Trie les décorations par position (`from` croissant) avant de les passer au `RangeSetBuilder`

**Règle clé** : `Decoration.replace` et `Decoration.mark` ne se chevauchent jamais dans notre implémentation — on utilise `firstChild`/`lastChild` pour cibler précisément les marqueurs et le contenu intérieur séparément.

**Piège Svelte 5** : l'effet `$effect` dans `Editor.svelte` qui recharge l'état CodeMirror doit utiliser `untrack(() => content)` pour ne pas se déclencher à chaque frappe (ce qui réinitialiserait le curseur).

## TODO :
- [ ] Corriger le bug qui apparait de temps en temps : Quand je rajoute des Blockquotes la preview ne fonctionne plus.
- [ ] Pouvoir créer un nouveau fichier
- [ ] Avoir un menu paramètres pour pouvoir gérer les options comme voir ou pas les numéros de lignes
- [ ] Pouvoir gérer un thème
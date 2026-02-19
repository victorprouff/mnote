import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { convertFileSrc } from '@tauri-apps/api/core';

// ── Helpers ──────────────────────────────────────────────────────────────────

function cursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const { from: f, to: t } of view.state.selection.ranges) {
    if (f <= to && t >= from) return true;
  }
  return false;
}

function cursorOnLine(view: EditorView, pos: number): boolean {
  const line = view.state.doc.lineAt(pos);
  return cursorInRange(view, line.from, line.to);
}

function resolveImageSrc(url: string, filePath: string | null): string {
  if (/^(https?|data|blob):/.test(url)) return url;
  let absolutePath: string;
  if (url.startsWith('/')) {
    absolutePath = url;
  } else if (filePath) {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    absolutePath = `${dir}/${url}`;
  } else {
    return url;
  }
  return convertFileSrc(absolutePath);
}

// ── Widgets ───────────────────────────────────────────────────────────────────

class HrWidget extends WidgetType {
  toDOM() {
    const el = document.createElement('div');
    el.className = 'cm-lp-hr';
    return el;
  }
  ignoreEvent() {
    return true;
  }
}

class ImageWidget extends WidgetType {
  constructor(readonly src: string, readonly alt: string) { super(); }
  eq(other: ImageWidget): boolean {
    return other instanceof ImageWidget && other.src === this.src && other.alt === this.alt;
  }
  toDOM(): HTMLElement {
    const img = document.createElement('img');
    img.src = this.src;
    img.alt = this.alt;
    img.className = 'cm-lp-img';
    return img;
  }
  ignoreEvent(): boolean { return true; }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-lp-bullet';
    span.textContent = '•';
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

// ── Decoration builder ────────────────────────────────────────────────────────

type DRange = { from: number; to: number; deco: Decoration };

function buildDecorations(view: EditorView, getFilePath: () => string | null): DecorationSet {
  const { state } = view;
  const collected: DRange[] = [];

  syntaxTree(state).iterate({
    from: view.viewport.from,
    to: view.viewport.to,
    enter(node) {
      // ── ATX Headings ──────────────────────────────────────────────────────
      if (/^ATXHeading[1-6]$/.test(node.name)) {
        if (!cursorOnLine(view, node.from)) {
          const level = node.name.slice(-1);
          const headerMark = node.node.firstChild; // the `#` node
          if (headerMark) {
            // Skip the `# ` prefix (HeaderMark + one space)
            let contentStart = headerMark.to;
            if (state.sliceDoc(contentStart, contentStart + 1) === ' ') contentStart++;
            // Hide the prefix
            collected.push({ from: node.from, to: contentStart, deco: Decoration.replace({}) });
            // Style the heading text
            if (contentStart < node.to) {
              collected.push({
                from: contentStart,
                to: node.to,
                deco: Decoration.mark({ class: `cm-lp-h${level}` }),
              });
            }
          }
        }
        return false; // children handled above
      }

      // ── Bold: **text** ────────────────────────────────────────────────────
      if (node.name === 'StrongEmphasis') {
        if (!cursorInRange(view, node.from, node.to)) {
          const first = node.node.firstChild;
          const last = node.node.lastChild;
          if (first && last && first !== last) {
            collected.push({ from: first.from, to: first.to, deco: Decoration.replace({}) });
            collected.push({
              from: first.to,
              to: last.from,
              deco: Decoration.mark({ class: 'cm-lp-strong' }),
            });
            collected.push({ from: last.from, to: last.to, deco: Decoration.replace({}) });
          }
        }
        return false;
      }

      // ── Italic: *text* ────────────────────────────────────────────────────
      if (node.name === 'Emphasis') {
        if (!cursorInRange(view, node.from, node.to)) {
          const first = node.node.firstChild;
          const last = node.node.lastChild;
          if (first && last && first !== last) {
            collected.push({ from: first.from, to: first.to, deco: Decoration.replace({}) });
            collected.push({
              from: first.to,
              to: last.from,
              deco: Decoration.mark({ class: 'cm-lp-em' }),
            });
            collected.push({ from: last.from, to: last.to, deco: Decoration.replace({}) });
          }
        }
        return false;
      }

      // ── Inline code: `code` ───────────────────────────────────────────────
      if (node.name === 'InlineCode') {
        if (!cursorInRange(view, node.from, node.to)) {
          const first = node.node.firstChild;
          const last = node.node.lastChild;
          if (first && last && first !== last) {
            collected.push({ from: first.from, to: first.to, deco: Decoration.replace({}) });
            collected.push({
              from: first.to,
              to: last.from,
              deco: Decoration.mark({ class: 'cm-lp-code' }),
            });
            collected.push({ from: last.from, to: last.to, deco: Decoration.replace({}) });
          }
        }
        return false;
      }

      // ── Horizontal rule ───────────────────────────────────────────────────
      if (node.name === 'HorizontalRule') {
        if (!cursorOnLine(view, node.from)) {
          collected.push({
            from: node.from,
            to: node.to,
            deco: Decoration.replace({ widget: new HrWidget() }),
          });
        }
        return false;
      }

      // ── Images: ![alt](url) → rendered <img> ─────────────────────────────────
      if (node.name === 'Image') {
        if (!cursorInRange(view, node.from, node.to)) {
          let url = '';
          let altStart = -1, altEnd = -1;
          let child = node.node.firstChild;
          while (child) {
            if (child.name === 'URL') {
              url = state.sliceDoc(child.from, child.to);
            } else if (child.name === 'LinkMark') {
              const txt = state.sliceDoc(child.from, child.to);
              if (txt === '[') altStart = child.to;
              if (txt === ']') altEnd = child.from;
            }
            child = child.nextSibling;
          }
          const alt = altStart !== -1 && altEnd !== -1 ? state.sliceDoc(altStart, altEnd) : '';
          const src = resolveImageSrc(url, getFilePath());
          collected.push({
            from: node.from,
            to: node.to,
            deco: Decoration.replace({ widget: new ImageWidget(src, alt) }),
          });
        }
        return false;
      }

      // ── Links: [text](url) ───────────────────────────────────────────────────
      if (node.name === 'Link') {
        if (!cursorInRange(view, node.from, node.to)) {
          let labelStart = -1;
          let labelEnd = -1;
          let child = node.node.firstChild;
          while (child) {
            if (child.name === 'LinkMark') {
              const txt = state.sliceDoc(child.from, child.to);
              collected.push({ from: child.from, to: child.to, deco: Decoration.replace({}) });
              if (txt === '[') labelStart = child.to;
              if (txt === ']') labelEnd = child.from;
            } else if (child.name === 'URL' || child.name === 'LinkTitle') {
              collected.push({ from: child.from, to: child.to, deco: Decoration.replace({}) });
            }
            child = child.nextSibling;
          }
          if (labelStart !== -1 && labelEnd !== -1 && labelStart < labelEnd) {
            collected.push({ from: labelStart, to: labelEnd, deco: Decoration.mark({ class: 'cm-lp-link' }) });
          }
        }
        return false;
      }

      // ── List marks: - / * / + / 1. ───────────────────────────────────────────
      if (node.name === 'ListMark') {
        if (!cursorOnLine(view, node.from)) {
          const markText = state.sliceDoc(node.from, node.to);
          const isUnordered = markText === '-' || markText === '*' || markText === '+';
          // Include the space that follows the mark
          let end = node.to;
          if (state.sliceDoc(node.to, node.to + 1) === ' ') end++;
          if (isUnordered) {
            collected.push({
              from: node.from,
              to: end,
              deco: Decoration.replace({ widget: new BulletWidget() }),
            });
          } else {
            // Ordered: keep the number visible, just style it
            collected.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: 'cm-lp-list-num' }) });
          }
        }
      }

      // ── Blockquote styling ─────────────────────────────────────────────────
      if (node.name === 'Blockquote') {
        collected.push({
          from: node.from,
          to: node.to,
          deco: Decoration.mark({ class: 'cm-lp-blockquote' }),
        });
        // visit children so QuoteMark is processed
      }

      // ── QuoteMark: `> ` ───────────────────────────────────────────────────
      if (node.name === 'QuoteMark') {
        if (!cursorOnLine(view, node.from)) {
          let end = node.to;
          if (state.sliceDoc(node.to, node.to + 1) === ' ') end++;
          collected.push({ from: node.from, to: end, deco: Decoration.replace({}) });
        }
      }
    },
  });

  // RangeSetBuilder requires ascending `from`; break ties by largest span first
  collected.sort((a, b) => a.from - b.from || b.to - a.to);

  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, deco } of collected) {
    builder.add(from, to, deco);
  }
  return builder.finish();
}

// ── Plugin ─────────────────────────────────────────────────────────────────────

export function createLivePreviewPlugin(getFilePath: () => string | null) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, getFilePath);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.selectionSet || u.viewportChanged) {
          this.decorations = buildDecorations(u.view, getFilePath);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}

// ── Theme ──────────────────────────────────────────────────────────────────────

export const livePreviewTheme = EditorView.theme({
  // Editor shell
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': {
    padding: '48px 64px',
    maxWidth: '860px',
    margin: '0 auto',
    lineHeight: '1.75',
    fontFamily: 'Georgia, "Palatino Linotype", serif',
    fontSize: '16px',
    color: '#d4d4d4',
    caretColor: '#569cd6',
  },
  '.cm-line': { padding: '0' },
  // Hide the focus outline that oneDark sometimes adds
  '&.cm-focused': { outline: 'none' },

  // ── Rendered elements ──────────────────────────────────────────────────────
  '.cm-lp-h1': {
    fontSize: '2em',
    fontWeight: '700',
    color: '#e4e4e4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    lineHeight: '1.3',
  },
  '.cm-lp-h2': {
    fontSize: '1.5em',
    fontWeight: '600',
    color: '#e4e4e4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    lineHeight: '1.3',
  },
  '.cm-lp-h3': {
    fontSize: '1.25em',
    fontWeight: '600',
    color: '#e4e4e4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  '.cm-lp-h4': {
    fontSize: '1.1em',
    fontWeight: '600',
    color: '#e4e4e4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  '.cm-lp-h5': { fontSize: '1em', fontWeight: '600', color: '#e4e4e4' },
  '.cm-lp-h6': { fontSize: '0.9em', fontWeight: '600', color: '#858585' },

  '.cm-lp-strong': { fontWeight: '700', color: '#e4e4e4' },
  '.cm-lp-em': { fontStyle: 'italic', color: '#c8c8c8' },

  '.cm-lp-code': {
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    fontSize: '0.875em',
    color: '#ce9178',
    background: 'rgba(255,255,255,0.07)',
    padding: '1px 5px',
    borderRadius: '3px',
  },

  '.cm-lp-link': {
    color: '#569cd6',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(86,156,214,0.4)',
    cursor: 'pointer',
  },

  '.cm-lp-img': {
    maxWidth: '100%',
    display: 'block',
    margin: '4px 0',
    borderRadius: '4px',
  },

  '.cm-lp-bullet': {
    color: '#858585',
    marginRight: '6px',
    fontFamily: 'sans-serif',
  },

  '.cm-lp-list-num': {
    color: '#858585',
  },

  '.cm-lp-blockquote': {
    borderLeft: '3px solid #569cd6',
    paddingLeft: '16px',
    color: '#858585',
    fontStyle: 'italic',
  },

  '.cm-lp-hr': {
    display: 'block',
    borderTop: '1px solid #3e3e42',
    height: '0',
    width: '100%',
    margin: '12px 0',
  },
});

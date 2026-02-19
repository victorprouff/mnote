<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { markdown } from '@codemirror/lang-markdown';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { EditorState } from '@codemirror/state';
  import { createLivePreviewPlugin, livePreviewTheme } from '../lib/live-preview';

  let {
    content,
    filePath,
    onContentChange,
  }: {
    content: string;
    filePath: string | null;
    onContentChange: (s: string) => void;
  } = $props();

  let container: HTMLDivElement;
  let view: EditorView;

  const extensions = [
    basicSetup,
    markdown(),
    oneDark,
    EditorView.lineWrapping,
    createLivePreviewPlugin(() => filePath),
    livePreviewTheme,
    EditorView.updateListener.of((u) => {
      if (u.docChanged) {
        const newContent = u.state.doc.toString();
        // Avoid a spurious save when setState() is called during file loading:
        // right after setState the CM doc equals the content prop, so there is
        // nothing to persist.
        if (newContent !== content) onContentChange(newContent);
      }
    }),
  ];

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({ doc: content, extensions }),
      parent: container,
    });
  });

  // Re-initialize editor state ONLY when the file changes, not on every keystroke.
  // `content` is read via untrack so it doesn't re-trigger this effect when the
  // user types (which would reset the editor and lose cursor position).
  $effect(() => {
    const _path = filePath; // tracked
    if (view) {
      const doc = untrack(() => content);
      view.setState(EditorState.create({ doc, extensions }));
    }
  });

  onDestroy(() => {
    view?.destroy();
  });
</script>

<div class="editor-wrap" bind:this={container}></div>

<style>
  .editor-wrap {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
  }

  /* Let CodeMirror fill the container */
  .editor-wrap :global(.cm-editor) {
    height: 100%;
  }
</style>

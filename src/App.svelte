<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Editor from './components/Editor.svelte';
  import { getVaultPath, readFile, saveFile } from './lib/tauri';

  let vaultPath: string | null = $state(null);
  let selectedFilePath: string | null = $state(null);
  // loadedFilePath is set AFTER readFile completes, so Editor only reinitialises
  // when both the path AND its content are ready (prevents stale-content writes).
  let loadedFilePath: string | null = $state(null);
  let fileContent: string = $state('');
  let isDirty: boolean = $state(false);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  onMount(async () => {
    vaultPath = await getVaultPath();
  });

  $effect(() => {
    if (selectedFilePath) {
      loadFile(selectedFilePath);
    } else {
      loadedFilePath = null;
      fileContent = '';
      isDirty = false;
    }
  });

  async function loadFile(path: string) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    isDirty = false;
    const content = await readFile(path);
    // Guard: if the user switched files while we were loading, discard the result.
    if (path !== selectedFilePath) return;
    fileContent = content;
    loadedFilePath = path;
  }

  function handleContentChange(content: string) {
    fileContent = content;
    isDirty = true;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      if (selectedFilePath) {
        await saveFile(selectedFilePath, content);
        isDirty = false;
      }
    }, 1000);
  }

  function getFileName(path: string | null): string {
    if (!path) return '';
    return path.split('/').pop() ?? path;
  }
</script>

<div class="app-layout">
  <Sidebar
    {vaultPath}
    {selectedFilePath}
    onFileSelect={(path) => { selectedFilePath = path; }}
    onVaultChange={(path) => { vaultPath = path; selectedFilePath = null; }}
  />

  <main class="main-content">
    {#if selectedFilePath}
      <div class="toolbar">
        <span class="file-name">{getFileName(selectedFilePath)}{isDirty ? ' ●' : ''}</span>
      </div>
      <Editor
        content={fileContent}
        filePath={loadedFilePath}
        onContentChange={handleContentChange}
      />
    {:else}
      <div class="empty-state">
        {#if vaultPath}
          <p>Select a file to edit</p>
        {:else}
          <p>Open a vault to get started</p>
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    padding: 0 16px;
    height: 36px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .file-name {
    font-size: 13px;
    color: var(--text-muted);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 16px;
  }
</style>

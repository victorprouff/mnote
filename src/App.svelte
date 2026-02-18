<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Preview from './components/Preview.svelte';
  import { getVaultPath } from './lib/tauri';

  let vaultPath: string | null = $state(null);
  let selectedFilePath: string | null = $state(null);

  onMount(async () => {
    vaultPath = await getVaultPath();
  });
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
      <Preview filePath={selectedFilePath} />
    {:else}
      <div class="empty-state">
        {#if vaultPath}
          <p>Select a file to preview</p>
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

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    font-size: 16px;
  }
</style>

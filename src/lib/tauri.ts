import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

export async function readDirectory(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>('read_directory', { path });
}

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

export async function saveVaultPath(path: string): Promise<void> {
  return invoke<void>('save_vault_path', { path });
}

export async function getVaultPath(): Promise<string | null> {
  return invoke<string | null>('get_vault_path');
}

export async function selectVaultFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select your vault folder',
  });
  return selected as string | null;
}

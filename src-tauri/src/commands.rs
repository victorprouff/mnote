use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Debug)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

#[tauri::command]
pub async fn read_directory(path: String) -> Result<Vec<FileNode>, String> {
    let dir_path = Path::new(&path);
    if !dir_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    read_dir_recursive(dir_path).map_err(|e| e.to_string())
}

fn read_dir_recursive(dir: &Path) -> Result<Vec<FileNode>, std::io::Error> {
    let mut entries: Vec<FileNode> = Vec::new();

    let mut read_entries: Vec<_> = fs::read_dir(dir)?.collect::<Result<_, _>>()?;

    // Directories first, then files — alphabetically within each group
    read_entries.sort_by(|a, b| {
        let a_is_dir = a.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        let b_is_dir = b.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        b_is_dir
            .cmp(&a_is_dir)
            .then_with(|| a.file_name().cmp(&b.file_name()))
    });

    for entry in read_entries {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files/directories
        if name.starts_with('.') {
            continue;
        }

        let is_dir = path.is_dir();

        if is_dir {
            let children = read_dir_recursive(&path)?;
            // Only include directories that contain at least one .md file (recursively)
            if !children.is_empty() {
                entries.push(FileNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    is_dir: true,
                    children: Some(children),
                });
            }
        } else {
            // Only include .md files
            if path.extension().and_then(|e| e.to_str()) != Some("md") {
                continue;
            }
            entries.push(FileNode {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir: false,
                children: None,
            });
        }
    }

    Ok(entries)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

const VAULT_CONFIG_FILE: &str = "vault.json";

#[tauri::command]
pub async fn save_vault_path(app: AppHandle, path: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    let config_file = app_data_dir.join(VAULT_CONFIG_FILE);
    let json = serde_json::json!({ "vault_path": path });
    fs::write(config_file, json.to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_vault_path(app: AppHandle) -> Result<Option<String>, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let config_file = app_data_dir.join(VAULT_CONFIG_FILE);

    if !config_file.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(config_file).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    Ok(json["vault_path"].as_str().map(String::from))
}

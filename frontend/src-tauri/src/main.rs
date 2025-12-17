// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::choose_vault_location,
            commands::initialize_vault,
            commands::list_documents,
            commands::read_document,
            commands::read_all_documents,
            commands::write_document,
            commands::delete_document,
            commands::create_document,
            commands::read_vault_structure,
            commands::write_vault_structure,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // No native commands or plugins are exposed to the remote dashboard.
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Failed to start ORBYVEN Desktop");
}

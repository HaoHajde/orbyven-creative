#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Only the locally bundled UI loads. No native commands, plugins, or remote
    // WebView URLs are exposed to content from the backend or elsewhere.
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Failed to start ORBYVEN Desktop");
}

pub mod auth;
pub mod vaults;
mod websocket;

pub use auth::auth_routes;
pub use vaults::vault_routes;
pub use websocket::ws_handler;

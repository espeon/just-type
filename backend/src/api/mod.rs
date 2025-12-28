pub mod audit;
pub mod auth;
pub mod organizations;
pub mod uploads;
pub mod users;
pub mod vaults;
mod websocket;

pub use audit::audit_routes;
pub use auth::auth_routes;
pub use organizations::organization_routes;
pub use uploads::upload_routes;
pub use users::user_routes;
pub use vaults::vault_routes;
pub use websocket::ws_handler;

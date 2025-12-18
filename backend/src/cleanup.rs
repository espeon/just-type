use chrono::Utc;
use sqlx::PgPool;
use tokio::time::{Duration, interval};

pub async fn start_cleanup_job(pool: PgPool) {
    tokio::spawn(async move {
        let mut tick = interval(Duration::from_secs(3600)); // Run every hour

        loop {
            tick.tick().await;

            if let Err(e) = cleanup_old_deletions(&pool).await {
                tracing::error!("Cleanup job failed: {}", e);
            }
        }
    });
}

async fn cleanup_old_deletions(pool: &PgPool) -> anyhow::Result<()> {
    let cutoff = Utc::now() - chrono::Duration::days(30);

    // Permanently delete vaults (cascades to subdocs, metadata, etc.)
    let result = sqlx::query("DELETE FROM vaults WHERE deleted_at IS NOT NULL AND deleted_at < $1")
        .bind(cutoff)
        .execute(pool)
        .await?;

    if result.rows_affected() > 0 {
        tracing::info!("Permanently deleted {} vaults", result.rows_affected());
    }

    Ok(())
}

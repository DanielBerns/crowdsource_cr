import structlog

# Import the infrastructure components
from infra.database.engine import engine
from infra.database.schema import Base

logger = structlog.get_logger()

def bootstrap_database():
    logger.info("Initializing database schema...")

    try:
        # 1. Create all tables defined in the schema
        # (If tables already exist, SQLAlchemy safely ignores them)
        Base.metadata.create_all(engine)
        logger.info("Database tables verified/created.")

        # 2. Output the credentials information for the developer
        print("\n" + "="*70)
        print("DATABASE INITIALIZED SUCCESSFULLY")
        print("="*70)
        print("No database admin user required for sync_job.py.")
        print("Please ensure your ADMIN_API_KEY is configured in your server.yaml")
        print("="*70 + "\n")

    except Exception as e:
        logger.error("Failed to bootstrap database", error=str(e))

if __name__ == "__main__":
    bootstrap_database()

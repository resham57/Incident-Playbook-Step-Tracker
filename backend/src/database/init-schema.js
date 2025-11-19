import dgraphClient from '../config/database.js';
import schema from './schema.js';
import logger from '../config/logger.js';

async function initializeSchema() {
  try {
    logger.info('Initializing Dgraph schema...');

    // Set schema
    const op = await dgraphClient.alter({ schema });

    logger.info('Schema initialized successfully!');
    logger.info('Schema operation result:', op);

    return true;
  } catch (error) {
    logger.error('Error initializing schema:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSchema()
    .then(() => {
      logger.info('Database schema setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Failed to initialize schema:', error);
      process.exit(1);
    });
}

export default initializeSchema;

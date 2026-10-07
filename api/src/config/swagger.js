const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const logger = require('../shared/logger');

const setupSwagger = (app) => {
  try {
    const yamlPath = path.resolve(__dirname, '../../../docs/openapi.yaml');
    const swaggerDoc = YAML.load(yamlPath);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    logger.info('📚 Swagger documentation mounted at /api/docs');
  } catch (err) {
    logger.warn({ err }, '⚠️ Could not load openapi.yaml for Swagger UI');
  }
};

module.exports = { setupSwagger };

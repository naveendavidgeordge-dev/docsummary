import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  azureStorageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents',
  azureStorageQueueName: process.env.AZURE_STORAGE_QUEUE_NAME || 'document-processing',
  azureKeyVaultUrl: process.env.AZURE_KEY_VAULT_URL,
}));

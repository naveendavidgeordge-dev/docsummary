import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { Logger } from '@nestjs/common';

export async function loadKeyVaultSecrets() {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    Logger.log('Azure Key Vault URL not set, skipping secret injection.', 'KeyVaultLoader');
    return;
  }

  try {
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(vaultUrl, credential);

    Logger.log(`Loading secrets from ${vaultUrl}...`, 'KeyVaultLoader');

    // List of secrets we expect in Key Vault
    const secretsToLoad = [
      { vaultName: 'DATABASE-URL', envName: 'DATABASE_URL' },
      { vaultName: 'JWT-SECRET', envName: 'JWT_SECRET' },
      { vaultName: 'STORAGE-CONNECTION-STRING', envName: 'AZURE_STORAGE_CONNECTION_STRING' },
    ];

    for (const secret of secretsToLoad) {
      try {
        const response = await client.getSecret(secret.vaultName);
        if (response.value) {
          process.env[secret.envName] = response.value;
          Logger.log(`Secret ${secret.vaultName} loaded successfully.`, 'KeyVaultLoader');
        }
      } catch (error) {
        Logger.warn(`Failed to load secret ${secret.vaultName}: ${error.message}`, 'KeyVaultLoader');
      }
    }
  } catch (error) {
    Logger.error(`Azure Key Vault connection failed: ${error.message}`, 'KeyVaultLoader');
  }
}

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const algorithm = 'aes-256-ctr';

export const secretTransformer = {
  to: (value: string) => {
    if (!value) {
      return value;
    }

    const key = getCredentialSecretKey();
    const iv = randomBytes(16); // Generate a unique IV for each encryption

    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Include IV in the encrypted value (e.g., IV:encryptedData)
    return `${iv.toString('hex')}:${encrypted}`;
  },
  from: (value: string) => {
    if (!value) {
      return value;
    }

    const key = getCredentialSecretKey();
    const [ivHex, encryptedData] = value.split(':');

    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted value format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};

export const getCredentialSecretKey = () => {
  const key = process.env.CREDENTIAL_SECRET_KEY;
  if (!key || key.length !== 32) {
    throw new Error('CREDENTIAL_SECRET_KEY must be a 32-character string');
  }
  return key;
};

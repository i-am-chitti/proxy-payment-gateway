import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const algorithm = 'aes-256-ctr';
const iv = randomBytes(16);

export const secretTransformer = {
  to: (value: string) => {
    // Bail if empty.
    if (!value) {
      return value;
    }

    const key = getCredentialSecretKey();

    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  },
  from: (value: string) => {
    // Bail if empty.
    if (!value) {
      return value;
    }

    const key = getCredentialSecretKey();

    const decipher = createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(value, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};

export const getCredentialSecretKey = () => {
  return process.env.CREDENTIAL_SECRET_KEY;
};

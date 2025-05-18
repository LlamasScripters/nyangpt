import * as crypto from 'crypto';

export class PasswordUtils {
  private static readonly ITERATIONS = 10000;
  private static readonly KEY_LENGTH = 64;
  private static readonly DIGEST = 'sha512';
  private static readonly SALT_LENGTH = 16;

  static hash(plainPassword: string): string {
    const salt = crypto.randomBytes(this.SALT_LENGTH).toString('base64');
    const hash = crypto
      .pbkdf2Sync(
        plainPassword,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        this.DIGEST,
      )
      .toString('base64');

    return `${salt}.${hash}`;
  }

  static compare(plainPassword: string, hashedPassword: string): boolean {
    try {
      if (hashedPassword.startsWith('hashed_')) {
        return hashedPassword === `hashed_${plainPassword}`;
      }

      const [salt, originalHash] = hashedPassword.split('.');

      if (!salt || !originalHash) {
        return false;
      }

      const hash = crypto
        .pbkdf2Sync(
          plainPassword,
          salt,
          this.ITERATIONS,
          this.KEY_LENGTH,
          this.DIGEST,
        )
        .toString('base64');

      return originalHash === hash;
    } catch (error) {
      console.error('Erreur lors de la comparaison des mots de passe:', error);
      return false;
    }
  }
}

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;
const HASH_PREFIX = 'scrypt';

export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error('Password must not be empty.');

  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: MAX_MEMORY,
  }) as Buffer;

  return [
    HASH_PREFIX,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string | null): Promise<boolean> {
  if (!password || !encodedHash) return false;

  try {
    const [prefix, costText, blockSizeText, parallelizationText, saltText, hashText, extra] = encodedHash.split('$');
    if (prefix !== HASH_PREFIX || extra !== undefined) return false;

    const cost = Number(costText);
    const blockSize = Number(blockSizeText);
    const parallelization = Number(parallelizationText);
    if (cost !== SCRYPT_COST || blockSize !== SCRYPT_BLOCK_SIZE || parallelization !== SCRYPT_PARALLELIZATION) {
      return false;
    }

    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (salt.length !== SALT_BYTES || expected.length !== KEY_LENGTH) return false;

    const actual = await scrypt(password, salt, expected.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: MAX_MEMORY,
    }) as Buffer;

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

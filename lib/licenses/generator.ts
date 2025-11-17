import { v4 as uuidv4 } from 'uuid';

export function generateLicenseKey(productId: string, userId: string): string {
  const key = `COREAURA-${productId.toUpperCase()}-${userId.toUpperCase()}-${uuidv4().toUpperCase()}`;
  return key;
}

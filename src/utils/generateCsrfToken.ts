import crypto from 'crypto';

export const generateCstToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
}

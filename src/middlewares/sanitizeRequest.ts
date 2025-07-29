import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../lib/sanitizeInput';

const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
        return sanitizeInput(obj);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            obj[key] = sanitizeObject(obj[key]);
        }
    }
    return obj;
}

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
}

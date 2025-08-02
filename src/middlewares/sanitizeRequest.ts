import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../lib/sanitizeInput';

/**
 *A given object sanitizes values in the array or string as self -authentic.
 *Change the object or array on-site.
 *@Param obj to be sanitized objects, sequences or string.
 *@returns sanitized object.
 */

const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
        return sanitizeInput(obj);
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = sanitizeObject(obj[key]);
            }
        }
    }
    return obj;
}

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
    // Call the req.body object on the spot by calling the function.
    // There is no need to re -assign the return value.
    sanitizeObject(req.body);

    // Change the Req.query object on -site.
    sanitizeObject(req.query);

    // Change the Req.Params object on -site.
    sanitizeObject(req.params);
    next();
}

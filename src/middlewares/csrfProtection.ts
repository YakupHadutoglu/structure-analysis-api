import { Request , Response , NextFunction } from 'express';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    const csrfTokenCookie = req.cookies['csrfToken'];
    const csrfTokenHeader = req.headers['x-csrf-token'];

    if (!csrfTokenCookie || !csrfTokenHeader) return res.status(403).json({ message: 'CSRF token missing' });

    if (csrfTokenCookie !== csrfTokenHeader) return res.status(403).json({ message: 'Invalid CSRF token' });

    next();
}


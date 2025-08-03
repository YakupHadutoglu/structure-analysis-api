import { Request, Response, NextFunction } from 'express';
import geoip from 'geoip-lite';
import logger from '../utils/logger';

type LogEntry = {
    ip: string;
    geo: geoip.Lookup | null;
    method: string;
    url: string;
    referer: string;
    userAgent: string;
    location: {
        country: string;
        region: string;
        city: string;
        ll: [number, number];
    } | null;
    timestamp: string;
    user?: { id: any; userName: any; email: any } | null;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||  // ilk ip al
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown';

    const geo = geoip.lookup(
        ip === '::1' || ip === '127.0.0.1' ? '8.8.8.8' : ip // Lokal IP ise test ip kullan
    );

    const method = req.method;
    const url = req.originalUrl;
    const referer = req.get('referer') || req.headers['referer'] || 'unknown';
    const userAgent = req.get('user-agent') || req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();

    const user = (res as any) && (res as any).locals && (res as any).locals.user ? (res as any).locals.user : null;

    const logData: LogEntry = {
        ip,
        geo,
        method,
        url,
        referer,
        userAgent,
        location: geo ? {
            country: geo.country || 'unknown',
            region: geo.region || 'unknown',
            city: geo.city || 'unknown',
            ll: geo.ll || [0, 0]
        } : null,
        timestamp,
        user: user ? {
            id: user.id,
            userName: user.userName,
            email: user.email
        } : null
    };
    const logMessage = `[${req.method}] ${req.originalUrl} | IP: ${ip} | User: ${user?.email || 'Anonymous'} | Referer: ${referer} | UA: ${userAgent} | Geo: ${geo?.city || 'N/A'}, ${geo?.country || 'N/A'}`;

    logger.http(logMessage);
    console.log(`>>logMessage : ${logMessage}`)
    next();
}





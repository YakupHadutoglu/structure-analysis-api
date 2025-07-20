import 'express';
import { Multer } from 'multer';

declare global {
    namespace Express {
        interface Request {
            file?: Express.Multer.File,
            files?: Express.Multer.File[]
        }
    }
}

declare module 'express-serve-static-core' {
    interface Request {
        file?: Express.Multer.File,
        files?: Express.Multer.File[]
    }
}


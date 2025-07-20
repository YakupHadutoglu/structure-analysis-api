import 'express';
import { file } from 'multer';

declare global {
    namespace Express {
        interface Request {
            file?: File,
            files?: File[]
        }
    }
}

declare module 'express-serve-static-core' {
    interface Request {
        file?: File,
        files?: File[]
    }
}

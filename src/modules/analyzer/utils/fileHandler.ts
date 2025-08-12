import path from 'path';
import fs from 'fs';
import { Express } from "express";

export const getTargetFolder = (file: Express.Multer.File): string => {
    const uploadsRoot = path.join(process.cwd(), 'src/uploads');
    const zipTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/zip-compressed'
    ];

    const tarTypes = [
        'application/gzip',
        'application/x-gzip',
        'application/tar+gzip'
    ];

    if (zipTypes.includes(file.mimetype)) {
        return path.join(uploadsRoot, 'zips');
    } else if (tarTypes.includes(file.mimetype)) {
        return path.join(uploadsRoot, 'tars');
    } else {
        return path.join(uploadsRoot, 'files');
    }
}

export const ensureFolderExits = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

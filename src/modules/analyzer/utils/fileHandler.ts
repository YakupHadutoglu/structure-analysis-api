import path from 'path';
import fs from 'fs';
import { Express } from "express";

export const getTargetFolder = (file: Express.Multer.File): string => {

    // const uploadsRoot = '/src/uploads/zips';
    const uploadsRoot = path.join(process.cwd() , 'src/uploads/zips');

    const isZip = [
        'application/zip',
        'application/x-zip-compressed',
        'zip'
    ].some(type => file.mimetype.includes(type) || path.extname(file.originalname).toLocaleLowerCase() === '.zip');

    return path.join(
        uploadsRoot,
        isZip ? 'zip' : 'file',
        file.originalname
    )
}

export const ensureFolderExits = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

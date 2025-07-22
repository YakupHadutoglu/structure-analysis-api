import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const UPLOADS_ROOT_DIR_ZIPS = path.resolve(process.cwd(), 'src/uploads/zips');
const UPLOADS_ROOT_DIR_FILES = path.resolve(process.cwd(), 'src/uploads/files');

/**
 *
 * @param file The full path to the ZIP file saved by Multer.
 * @returns The path to the directory where the extracted files are located.
 * @throws In case of error (file not found, extraction error etc.) it throws an error.
 */

export const zipParser = async (file: Express.Multer.File): Promise<string> => {

    console.log('starting ZIP extraction for: ', file);

    if (!fs.existsSync(file.path)) throw new Error(`ZIP file not found at path: ${file}`);

    const zip = new AdmZip(file.path);
    const TargetextractDir = path.join(UPLOADS_ROOT_DIR_FILES, path.parse(file.originalname).name);

    if (!fs.existsSync(TargetextractDir)) {
        fs.mkdirSync(TargetextractDir, { recursive: true });
        console.log(`Created extraction directory: ${TargetextractDir}`);
    }

    try {
        zip.extractAllTo(TargetextractDir, true);
        console.log(`Succesfully extracted ZIP files to : ${TargetextractDir}`);
        return TargetextractDir;
    } catch (error) {
        console.error(`Error during ZIP extraction of ${file.path}:`, error);

        if (fs.existsSync(TargetextractDir)) {
            fs.rmSync(TargetextractDir, { recursive: true });
            console.log(`Deleted extraction directory: ${TargetextractDir}`);
        }
        throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : error}`);
    }
}

import { zipParser } from './zipParser.service';
import { Express } from 'express';
export const analyze = async (file: Express.Multer.File) => {

    let result: any;

    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
        try {
            const resolved = await zipParser(file);
            // result = await fileStructureAnalysis(resolved);
            console.log("The given file was sent to the zip solution")
        } catch (error) {
            console.error("Error processing zip file: ", error);
            if (error instanceof Error) {
                throw new Error(`Failed to process zip file: ${error.message}`);
            } else {
                throw new Error('Failed to process zip file: Unknown error');
            }
        }
    } else {
        try {
            result = await fileStructureAnalysis(file);
            console.log("The given file was sent to the file solution")
        } catch (error) {
            console.error("Error processing zip file: ", error);
            if (error instanceof Error) throw new Error(error.message);
        }
    }
    return result;
}

const fileStructureAnalysis = async (file: Express.Multer.File) => {
    return "";
}

import multer from 'multer';
import { getTargetFolder, ensureFolderExits } from '../analyzer/utils/fileHandler';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const targetFolder = getTargetFolder(file);
        ensureFolderExits(targetFolder);
        cb(null, targetFolder);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({storage})

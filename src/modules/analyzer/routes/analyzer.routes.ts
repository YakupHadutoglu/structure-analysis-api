import express, { Router } from 'express';
import multer from 'multer';

import { fileUpload } from '../controllers/fileUpload.controller'
import { upload } from '/home/oem/Yedek/projeler/Back-end/structure-analysis-api/src/modules/config/multer'

const router = express.Router();

router.post('/analyze', upload.single('file'), fileUpload);

export default router;

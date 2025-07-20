import express, { Router } from 'express';
import multer from 'multer';

import { fileUpload } from '../controllers/fileUpload.controller'
import { upload } from 'modules/config/multer'

const router = express.Router();

router.post('/analyze', upload.single('file'), fileUpload);

export default router;

import express , { Router } from 'express';
import multer from 'multer';
import { fileUpload } from '../controllers/fileUpload.controller'

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/analyze' , upload.single('file'), fileUpload)

import express , { Router } from 'express';
import { refreshAccessToken } from '../controllers/token.controller';
import { csrfProtection } from "../middlewares/csrfProtection";

const router: Router = express.Router();

router.post('/refresh-token', csrfProtection , refreshAccessToken);

export default router;

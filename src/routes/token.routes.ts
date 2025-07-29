import express , { Router } from 'express';
import { refreshAccessToken } from '../controllers/token.controller';

const router: Router = express.Router();

router.post('/refresh-token', refreshAccessToken);

export default router;

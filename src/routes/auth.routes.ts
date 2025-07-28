import express , { Router } from "express";
const router: Router = express.Router();

import { userCreate } from '../controllers/auth.controller';

router.post('/register', userCreate);

export default router;





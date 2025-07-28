import express , { Router } from "express";
const router: Router = express.Router();

import { userCreate , userLogin , userLogout } from '../controllers/auth.controller';


router.post('/register', userCreate);
router.post('/login', userLogin);
router.post('/logout', userLogout);

export default router;





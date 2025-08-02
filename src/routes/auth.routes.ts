import express , { Router } from "express";
const router: Router = express.Router();

import { userCreate , userLogin , userLogout } from '../controllers/auth.controller';
import { authentication } from '../middlewares/authenticate';
import { csrfProtection } from '../middlewares/csrfProtection';

router.post('/register', userCreate);
router.post('/login', userLogin);
router.post('/logout' , csrfProtection , authentication , userLogout);

export default router;





import express , { Router } from "express";
const router: Router = express.Router();

import { userCreate , userLogin , userLogout } from '../controllers/auth.controller';
import { authentication } from '../middlewares/authenticate';

router.post('/register', userCreate);
router.post('/login', userLogin);
router.post('/logout' , authentication , userLogout);

export default router;





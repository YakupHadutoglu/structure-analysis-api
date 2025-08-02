import express, { Router } from "express";

import { generateCstToken } from '../utils/generateCsrfToken';
import env from "../config/env";
const router: Router = express.Router();

router.get('/csrf-token', (req, res) => {
    const csrfToken = generateCstToken();
    res.cookie('csrfToken', csrfToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production' ? true : false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({ csrfToken: csrfToken });
});

export default router;

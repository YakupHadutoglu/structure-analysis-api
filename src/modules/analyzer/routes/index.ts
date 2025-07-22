import express, { Application, Router } from 'express';
const router: Router = express.Router();

import analyzer from './analyzer.routes';

router.use(analyzer);

export default router;



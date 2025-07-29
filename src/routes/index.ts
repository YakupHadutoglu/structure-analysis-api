import express, { Express , Router } from 'express';
const app: Express = express();

import auth from './auth.routes';
import analyzer from '../modules/analyzer/routes';

app.use(auth);
app.use(analyzer);

export default app;


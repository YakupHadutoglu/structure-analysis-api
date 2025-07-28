import express, { Express , Router } from 'express';
const app: Express = express();

import auth from './auth.routes';

app.use(auth);

export default app;


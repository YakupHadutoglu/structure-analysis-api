import express, { Express , Router } from 'express';
const app: Express = express();

import auth from './auth.routes';
import analyzer from '../modules/analyzer/routes';
import token from './token.routes';
import csrfToken from './csrf.routes';

import { authentication } from '../middlewares/authenticate';

app.use('/auth' , auth);
app.use('/analyzer' , authentication , analyzer);
app.use('/token', token);
app.use('/csrf-token', csrfToken);

export default app;


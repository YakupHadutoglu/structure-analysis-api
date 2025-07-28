import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from 'cors';
import session from 'express-session';

import env from './config/env';
import routes from './routes';


const app: Express = express();

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session({ secret: env.SECRET_KEY, resave: false, saveUninitialized: true, cookie: { secure: false } }));

//Routes
app.use(routes);

app.get('/', (req: Request , res: Response): void => {
    res.send('merhaba');
})

export default app;




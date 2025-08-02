import express, { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from 'cors';
import session from 'express-session';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';

const app: Express = express();

import env from './config/env';
import routes from './routes';
import connectDB from "./config/db";
import limiter from "./middlewares/rateLimit";
import noCache from "./middlewares/noCache";
import { sanitizeRequest } from "./middlewares/sanitizeRequest";
import logger from './utils/logger';

const logDirectory = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a', encoding: 'utf8' });

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: env.NODE_ENV === 'production' ? 'https://your-production-domain.com' : 'http://localhost:3000',
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(session({ secret: env.SECRET_KEY, resave: false, saveUninitialized: true, cookie: { secure: false } }));
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
            frameAncestors: ["'none'"],
        }
    }),
    helmet.crossOriginEmbedderPolicy(),
    helmet.crossOriginOpenerPolicy(),
    helmet.crossOriginResourcePolicy(),
    helmet.dnsPrefetchControl(),
);
app.use(limiter);
app.use(noCache);
// app.use(mongoSanitize());
app.use(sanitizeRequest);
app.use(morgan('combined', {
    stream: {
        write: (message) => {
            console.log('Morgan log:', message.trim()); // terminalde gör
            accessLogStream.write(message);
        }
    }
})); // Print to the console
app.use(morgan('combined', { stream: accessLogStream })); // Print it to the file

//Routes
app.use(routes);

//Database connection
connectDB();

app.get('/', (req: Request, res: Response): void => {
    res.send('merhaba');
})

export default app;




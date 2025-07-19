import express , { Express, Request, Response } from "express";

const app: Express = express();

app.get('/', (req: Request , res: Response): void => {
    res.send('merhaba');
})

export default app;




import express , { Express , Request, Response } from 'express';
import { resourceLimits } from 'node:worker_threads';
import { analyze } from '../services/analyzer.service';

export const fileUpload = async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) return res.status(400).send('no file');

    let result: any;
    result = await analyze(file);


    // const result = await analyze(file);
    res.json(result)
}

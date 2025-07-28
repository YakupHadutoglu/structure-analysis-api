import express, { Express, Request, Response } from 'express';

import { createUser } from '../services/auth.service';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/jwt';
import env from '../config/env';

export const userCreate = async (req: Request, res: Response) => {
    const { userName, email, password } = req.body;
    try {
        if (!userName) return res.status(400).json("Username cannot be empty");
        if (userName.length < 3 && userName.length > 20) return res.status(400).json("Username must be at least 3 characters");

        if (!email) return res.status(400).json("Email cannot be empty");
        if (isEmail(email) === false) return res.status(400).json("Invalid Email");

        if (!password) res.status(400).json("Password cannot be empty");
        if (password.length < 6 && password.length > 100) return res.status(400).json("Password must be at least 6 characters");

        const createResults = await createUser(userName, email, password);
        const user_id = createResults._id;

        await generateToken(user_id, userName, email, password);

        res.cookie('token', generateToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production' ? true : false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json("User created successfully");
    } catch (error) {
        console.log(error);
        if (error instanceof Error) return res.status(500).json(`Server Error : ${error.message}`);
        res.status(500).json(`Server Error`);
    }
}

export function isEmail(email: string): boolean {
    let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return emailFormat.test(email);
}

import express, { Express, Request, Response } from 'express';

import { createUser, loginUser } from '../services/auth.service';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/jwt';
import { generateAccessToken, generateRefreshToken } from '../utils/token';
import env from '../config/env';
import User from '../models/User';


export const userCreate = async (req: Request, res: Response) => {
    const { userName, email, password } = req.body;
    try {
        if (!userName) return res.status(400).json("Username cannot be empty");
        if (userName.length < 3 || userName.length > 20) return res.status(400).json("Username must be at least 3 characters");

        if (!email) return res.status(400).json("Email cannot be empty");
        if (isEmail(email) === false) return res.status(400).json("Invalid Email");

        if (!password) return res.status(400).json("Password cannot be empty");
        if (password.length < 6 || password.length > 100) return res.status(400).json("Password must be at least 6 characters");

        const createResults = await createUser(userName, email, password);
        const user_id = createResults._id;

        // const token = await generateToken(user_id, userName, email);

        const accessToken = await generateAccessToken(user_id, userName, email);
        const refreshToken = generateRefreshToken(user_id, userName, email);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production' ? true : false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
        });

        console.log("User created successfully:", createResults);
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: createResults._id,
                userName: createResults.userName,
                email: createResults.email
            }
        }
        );
    } catch (error) {
        console.log(error);
        if (error instanceof Error) return res.status(500).json(`Server Error : ${error.message}`);
        res.status(500).json(`Server Error`);
    }
}

export const userLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email) return res.status(400).json("Email cannot be empty");
        if (isEmail(email) === false) return res.status(400).json("Invalid Email");

        if (!password) return res.status(400).json("Password cannot be empty");

        const user = await loginUser(email, password);

        const accessToken = generateAccessToken(user._id.toString(), user.userName, user.email);
        const refreshToken = generateRefreshToken(user._id.toString(), user.userName, user.email);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production' ? true : false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 
        });

        res.status(200).json({
            message: "login succesfully",
            user: {
                id: user._id,
                userName: user.userName,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        if (error instanceof Error) return res.status(500).json(`Server Error : ${error.message}`);
        res.status(500).json(`Server Error`);

    }
}

export const userLogout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: env.NODE_ENV === 'production' ? true : false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json({
            message: "Logout succesfully",
            token: null,
            user: null
        });

    } catch (error) {
        console.error('Error during user logout:', error);
        if (error instanceof Error) return res.status(500).json(`Server Error : ${error.message}`);
        res.status(500).json(`Server Error`);
    }
}

export function isEmail(email: string): boolean {
    let emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return emailFormat.test(email);
}


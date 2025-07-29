import { Request , Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env'

/**
 * Generates a JWT token for the user.
 * @param {string} id - The user's ID.
 * @param {string} username - The user's username.
 * @param {string} email - The user's email.
 * @returns {string} The generated JWT token.
 */

export type GenerateToken = (id: string, username: string, email: string) => string;
const res: Response = {} as Response; // Mocking the response object for demonstration purposes
const req: Request = {} as Request; // Mocking the request object for demonstration purposes

const generateToken = (id: string, username: string, email: string): string => {
    const token = jwt.sign({ id, username, email }, env.SECRET_KEY, { expiresIn: '7d' });

    console.log(`>>> Token: ${token}`);

    return token;
}

export default generateToken;


import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import User from '../models/User';
import { userLogin } from 'controllers/auth.controller';
import { verifyAccessToken } from '../utils/token';


/**
 * Middleware to authenticate user based on JWT token stored in cookies.
 * If the token is valid, it allows the request to proceed; otherwise, it returns a 401 Unauthorized response.
 */

interface jwtPayload {
    id: string;
    userName: string;
    email: string;
}

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        // const decoded = await jwt.verify(token, env.SECRET_KEY) as jwtPayload;
        const decoded = verifyAccessToken(token);

        // Check if the user exists in the database
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        res.locals.user = {
            id: user._id,
            userName: user.userName,
            email: user.email,
        }

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expired" });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
        } else {
            console.error(error);
            return res.status(401).json({ message: "Unauthorized" });
        }
    }
}


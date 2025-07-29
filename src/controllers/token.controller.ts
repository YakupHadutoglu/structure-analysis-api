import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import env from "../config/env";

export const refreshAccessToken = (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(401).json({ message: 'Refresh token not found' });

    try {
        const userData = verifyRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken(userData.id, userData.userName, userData.email);

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 dakika
        });

        res.status(200).json({
            message: 'Access token refreshed successfully',
            user: {
                id: userData.id,
                userName: userData.userName,
                email: userData.email
            }
        });
    } catch (error) {
        console.error("Error refreshing access token:", error);
        if (error instanceof jwt.TokenExpiredError) {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
            });
            return res.status(401).json({ message: "Refresh token expired" });
        }
        if (error instanceof jwt.TokenExpiredError) return res.status(401).json({ message: "Refresh token expired" });

        if (error instanceof jwt.JsonWebTokenError) return res.status(403).json({ message: "Invalid refresh token" });

        return res.status(500).json({ message: "Internal server error" });
    }
}

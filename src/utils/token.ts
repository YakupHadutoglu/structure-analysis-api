import jwt from "jsonwebtoken";
import env from "../config/env";

type payload = {
    id: string,
    userName: string,
    email: string
}

export const generateAccessToken = (id: string , userName: string , email: string): string => {
    const payload: payload = { id, userName, email };
    return jwt.sign(payload, env.ACCESS_SECRET, { expiresIn: '60m' });
}

export const generateRefreshToken = (id: string, userName: string, email: string): string => {
    const payload: payload = { id, userName, email };
    return jwt.sign(payload, env.REFRESH_SECRET, { expiresIn: '7d' });
}

export const verifyAccessToken = (token: string): payload => {
    return jwt.verify(token , env.ACCESS_SECRET) as payload;
}

export const verifyRefreshToken = (token: string): payload => {
    return jwt.verify(token , env.REFRESH_SECRET) as payload;
}

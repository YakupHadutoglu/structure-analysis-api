import bcrypt from 'bcrypt';
import { HydratedDocument } from 'mongoose';

import User from '../models/User';
import env from '../config/env'
import { IUser } from '../types/IUser';

export const createUser = async (userName: string, email: string, password: string): Promise<IUser> => {

    const existingUser = await User.findOne({ email });

    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, Number(env.SALT_ROUNDS));

    const user = new User({
        userName: userName,
        email: email,
        password: hashedPassword
    });

    await user.save();

    return user;
}

export const loginUser = async (email: string, password: string): Promise<IUser> => {
    try {
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials");
        
        return user;
    } catch (error) {
        console.error("Error during user login:", error);
        throw new Error("Login failed");
    }
}


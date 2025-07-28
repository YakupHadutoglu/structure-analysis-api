import mongoose from 'mongoose';

import { IUser } from 'types/IUser';

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    }
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;

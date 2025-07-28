import dotenv from 'dotenv';
dotenv.config();

type ENV = {
    PORT: string | number,
    NODE_ENV: string,
    SECRET_KEY: string,
    SALT_ROUNDS: number | string
}

const env: ENV = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'devolopment',
    SECRET_KEY: process.env.SECRET_KEY || 'secret',
    SALT_ROUNDS: process.env.SALT_ROUNDS || 10
}

export default env;

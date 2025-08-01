import dotenv from 'dotenv';
dotenv.config();

type ENV = {
    PORT: string | number,
    NODE_ENV: string,
    SECRET_KEY: string,
    SALT_ROUNDS: number | string,
    MONGO_URI?: string,
    ACCESS_SECRET: string,
    REFRESH_SECRET: string

}

const env: ENV = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'devolopment',
    SECRET_KEY: process.env.SECRET_KEY || 'secret',
    SALT_ROUNDS: process.env.SALT_ROUNDS || 10,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/structure_analysis_api',
    ACCESS_SECRET: process.env.ACCESS_SECRET || 'access_secret',
    REFRESH_SECRET: process.env.REFRESH_SECRET || 'refresh_secret'
}

export default env;

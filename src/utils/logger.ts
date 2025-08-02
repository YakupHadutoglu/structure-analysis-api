import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const consoleFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

const fileFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message} [${info.stack || ''}]`)
);

const logger = createLogger({
    level: 'info',
    transports: [
        new transports.Console({
            format: consoleFormat
        }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-combined.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '20d',
            format: fileFormat
        }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-error.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            zippedArchive: true,
            maxFiles: '30d',
            format: fileFormat
        }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-access.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '20d',
            format: fileFormat
        }),
    ],
    exitOnError: false
});

export default logger;

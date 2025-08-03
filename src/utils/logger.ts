import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const consoleFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

const fileFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message} [${info.stack || ''}]`)
);

const accessTransport = new DailyRotateFile({
    filename: 'logs/%DATE%-access.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '20d',
    level: 'info', // info seviyesinde loglar
    format: fileFormat
});

const baseLogger = createLogger({
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
    },
    level: 'http',
    format: fileFormat,
        transports: [
        new transports.Console({
            format: consoleFormat,
            level: 'http'
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
        new DailyRotateFile({
            filename: 'logs/%DATE%-access.log',
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            zippedArchive: true,
            maxFiles: '20d',
            format: fileFormat,
        }),
    ],
    exitOnError: false
});

// Custom log level method: http
const logger = baseLogger as Logger & {
    http: (msg: string) => Logger;
};

(logger as any).http = (msg: string) => {
    logger.log('http', msg);
    return logger;
};

export default logger;

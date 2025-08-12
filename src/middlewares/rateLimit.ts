import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20000, // Limit each IP to 5000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ipv6Subnet: 56, // Use a /56 subnet for IPv6 addresses
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});

export default limiter;

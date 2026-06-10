import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const base = `${timestamp} [${level}] ${message}`;
      return stack ? `${base}\n${stack}` : base;
    }),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import config from './config.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const prisma = new PrismaClient();
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(config.apiPrefix, apiRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorHandler);

process.on('SIGINT', async () => {
  logger.info('Shutting down server');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

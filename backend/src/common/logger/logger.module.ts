import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { sanitizeLogData } from './log-sanitizer.util';

const isProduction = process.env.NODE_ENV === 'production';

const sanitizeFormat = winston.format((info) => {
  const sanitized = sanitizeLogData(info) as Record<string, unknown>;
  return sanitized as winston.Logform.TransformableInfo;
});

function buildDevFormat(): winston.Logform.Format {
  return winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(
      ({ timestamp, level, message, context, trace, ...meta }) => {
        const metaStr = Object.keys(meta).length
          ? JSON.stringify(meta)
          : '';
        const traceStr = trace ? `\n${trace}` : '';
        return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${metaStr}${traceStr}`;
      },
    ),
  );
}

function buildProductionTransports(): winston.transport[] {
  return [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ];
}

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        sanitizeFormat(),
        isProduction ? winston.format.json() : buildDevFormat(),
      ),
      transports: [
        new winston.transports.Console(),
        ...(isProduction ? buildProductionTransports() : []),
      ],
      defaultMeta: {
        service: process.env.APP_NAME || 'ofinanceiro',
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}

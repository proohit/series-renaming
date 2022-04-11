import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { timestamp: new Date().toISOString() },
  transports: [
    new winston.transports.Stream({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      stream: process.stdout,
    }),
    new winston.transports.File({
      filename: "error.log",
      format: winston.format.json(),
      level: "error",
    }),
    new winston.transports.File({
      filename: "debug.log",
      format: winston.format.json(),
      level: "debug",
    }),
    new winston.transports.File({
      filename: "combined.log",
      format: winston.format.json(),
    }),
  ],
});

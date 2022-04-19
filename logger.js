import winston from "winston";

const logsFolder = process.argv
  .find((arg) => arg.includes("logs-folder"))
  ?.split("=")[1];

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
      filename: `${logsFolder}/debug.log`,
      format: winston.format.json(),
      level: "debug",
    }),
    new winston.transports.File({
      filename: `${logsFolder}/combined.log`,
      format: winston.format.json(),
    }),
  ],
});

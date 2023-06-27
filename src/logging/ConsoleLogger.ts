import { ILogger } from './ILogger';

type LevelMap = {
  debug: number;
  info: number;
  error: number;
  warn: number;
};

const levelMap: LevelMap = {
  debug: 3,
  error: 0,
  info: 2,
  warn: 1,
};

const shouldLog = (level: string, target: string) => {
  const a = levelMap[level as keyof LevelMap] ?? 0;
  const b = levelMap[target as keyof LevelMap] ?? 0;

  return a >= b;
};

export class ConsoleLogger implements ILogger {
  constructor(private readonly level: string) {}

  log(level: string, message: string) {
    if (shouldLog(this.level, level)) {
      console.log(`${level}: ${message}`);
    }
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  info(message: string): void {
    this.log('info', message);
  }

  warn(message: string): void {
    this.log('warn', message);
  }

  error(message: string): void {
    this.log('error', message);
  }
}

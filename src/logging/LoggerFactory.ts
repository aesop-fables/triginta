import { inject } from '@aesop-fables/containr';
import { ILogger, NulloLogger } from './ILogger';
import { ILoggerFactory } from './ILoggerFactory';
import { LoggingLevel } from './Levels';
import { LoggingServices } from './LoggingServices';
import { ConsoleLogger } from './ConsoleLogger';

export class LoggerFactory implements ILoggerFactory {
  constructor(@inject(LoggingServices.Levels) private readonly levels: LoggingLevel) {}

  createLogger(): ILogger {
    const level = this.levels.resolveLevel();
    if (!level) {
      return new NulloLogger();
    }

    return new ConsoleLogger(level);
  }
}

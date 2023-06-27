import { ILogger } from './ILogger';

/**
 * Provides a mechanism for contextually building up a logger
 */
export interface ILoggerFactory {
  createLogger(): ILogger;
}

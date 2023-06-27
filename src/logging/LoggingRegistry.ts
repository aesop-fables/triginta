import { IServiceRegistry, Newable, Scopes, ServiceCollection } from '@aesop-fables/containr';
import { Logger } from 'aws-sdk/lib/config-base';
import { ILoggerFactory } from './ILoggerFactory';
import { LoggingServices } from './LoggingServices';
import { LoggingLevel } from './Levels';
import { LoggerFactory } from './LoggerFactory';

export class LoggingRegistry implements IServiceRegistry {
  constructor(private readonly levels: Newable<LoggingLevel>) {}

  configureServices(services: ServiceCollection): void {
    services.factory<LoggingLevel>(
      LoggingServices.Levels,
      (container) => {
        return container.resolve(this.levels);
      },
      Scopes.Transient,
    );

    services.autoResolve<ILoggerFactory>(LoggingServices.Factory, LoggerFactory, Scopes.Transient);

    services.factory<Logger>(
      LoggingServices.Logger,
      (container) => {
        const factory = container.get<ILoggerFactory>(LoggingServices.Factory);
        return factory.createLogger();
      },
      Scopes.Transient,
    );
  }
}

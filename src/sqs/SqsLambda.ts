/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createContainer,
  createServiceModule,
  createServiceModuleWithOptions,
  injectContainer,
  IServiceContainer,
  IServiceModule,
  Newable,
  Scopes,
} from '@aesop-fables/containr';
import { Context, SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import { ISqsMessageHandler, SqsOutput } from './ISqsMessageHandler';
import { getMiddleware } from '../Decorators';
import { SqsLambdaServices } from './SqsLambdaServices';
import { ISqsMessage } from './ISqsMessage';
import {
  DefaultSqsRecordMatcher,
  ISqsMessageDeserializer,
  ISqsRecordMatcher,
  SqsMessageDeserializer,
} from './RecordMatchers';
import { ISqsPublisher, SqsPublisher } from './SqsPublisher';
import { IMessagePublisher, MessagePublisher } from './MessagePublisher';
import { SqsSettings } from './SqsSettings';
import { CurrentRecordLoggingLevel, LoggingRegistry } from '../logging';
import { AwsServices } from '../AwsServices';
import { resolveTrigintaRuntime, trigintafy } from '../TrigintaMiddleware';

export interface BootstrappedSqsLambdaContext {
  createSqsHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler;
}

export interface ISqsLambdaFactory {
  createHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler;
}

function embedSqsEvent(event: SQSEvent): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/sqs/event', (services) => {
    services.singleton<SQSEvent>(AwsServices.Event, event);
  });
}

function embedSqsRecord(record: SQSRecord): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/sqs/record', (services) => {
    services.singleton<SQSRecord>(SqsLambdaServices.CurrentRecord, record);
  });
}

function embedSqsContext(context: Context): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/sqs/context', (services) => {
    services.singleton<Context>(AwsServices.Context, context);
  });
}

export class SqsLambdaFactory implements ISqsLambdaFactory {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  createHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler {
    const handler = async (event: SQSEvent, context: Context) => {
      for (let i = 0; i < event.Records.length; i++) {
        const record = event.Records[i];
        // This should be resolved from the runtime
        const { container } = resolveTrigintaRuntime(context);
        if (!container) {
          throw new Error('No container found in the context');
        }
        const childContainer = container.createChildContainer('sqsLambda', [
          embedSqsEvent(event),
          embedSqsRecord(record),
          embedSqsContext(context),
        ]);
        try {
          const innerHandler = childContainer.resolve(newable);
          const deserializer = childContainer.get<ISqsMessageDeserializer>(SqsLambdaServices.MessageDeserializer);
          const message = await deserializer.deserializeMessage<Message>(record);
          await innerHandler.handle(message as Message, record, event);

          // TODO -- Add the failure handler
        } finally {
          if (childContainer) {
            try {
              childContainer.dispose();
            } catch {
              // no-op
            }
          }
        }
      }
    };

    const middlewareMetadata = getMiddleware(newable) || [];
    return trigintafy(handler, middlewareMetadata, {
      container: this.container,
      source: 'http',
      overrides: [],
    });
  }
}

export interface TrigintaLegacySqsOptions {
  matchers?: ISqsRecordMatcher[];
}

export const useTrigintaSqs = createServiceModuleWithOptions<TrigintaLegacySqsOptions>(
  'triginta/sqs',
  (services, options) => {
    services.autoResolve<ISqsLambdaFactory>(SqsLambdaServices.SqsLambdaFactory, SqsLambdaFactory, Scopes.Transient);

    const { matchers = [] } = options;
    matchers.forEach((matcher) => {
      services.array<ISqsRecordMatcher>(SqsLambdaServices.RecordMatchers, matcher);
    });
    services.singleton<SqsSettings>(SqsLambdaServices.SqsSettings, {} as SqsSettings);
    services.autoResolve<ISqsRecordMatcher>(
      SqsLambdaServices.DefaultRecordMatcher,
      DefaultSqsRecordMatcher,
      Scopes.Transient,
    );
    services.autoResolve<ISqsMessageDeserializer>(
      SqsLambdaServices.MessageDeserializer,
      SqsMessageDeserializer,
      Scopes.Transient,
    );
    services.autoResolve<ISqsPublisher>(SqsLambdaServices.SqsPublisher, SqsPublisher, Scopes.Transient);
    services.autoResolve<IMessagePublisher>(SqsLambdaServices.MessagePublisher, MessagePublisher, Scopes.Transient);

    services.include(new LoggingRegistry(CurrentRecordLoggingLevel));
  },
);

export interface SqsLambdaBootstrapExpression {
  matchers?: ISqsRecordMatcher[];
  modules?: IServiceModule[];
}

export function createBootstrappedSqsLambdaContext(container: IServiceContainer): BootstrappedSqsLambdaContext {
  return {
    createSqsHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
      newable: Newable<ISqsMessageHandler<Message, Output>>,
    ): SQSHandler {
      if (typeof container === 'undefined') {
        throw new Error(`SQS container not initialized`);
      }

      const factory = container.get<ISqsLambdaFactory>(SqsLambdaServices.SqsLambdaFactory);
      return factory.createHandler(newable);
    },
  };
}

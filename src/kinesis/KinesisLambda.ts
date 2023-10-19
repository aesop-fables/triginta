/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createServiceModule,
  injectContainer,
  IServiceContainer,
  IServiceModule,
  Newable,
  Scopes,
} from '@aesop-fables/containr';
import middy from '@middy/core';
import { IKinesisRecordHandler } from './IKinesisRecordHandler';
import { getMiddleware } from '../Decorators';
import { KinesisLambdaServices } from './KinesisLambdaServices';
import {
  Context,
  KinesisStreamEvent,
  KinesisStreamRecord,
  KinesisStreamHandler,
  KinesisStreamBatchResponse,
} from 'aws-lambda';
import { AwsServices } from '../AwsServices';
import { resolveTrigintaRuntime, trigintafy } from '../TrigintaMiddleware';
import { IKinesisRecordFailureHandler, KinesisRecordFailureHandler } from './IKinesisFailureHandler';
import { IKinesisDataSerializer, KinesisDataSerializer } from './IKinesisDataSerializer';

export interface BootstrappedKinesisLambdaContext {
  createKinesisHandler<Data>(newable: Newable<IKinesisRecordHandler<Data>>): KinesisStreamHandler;
}

export interface IKinesisLambdaFactory {
  createHandler<Data>(newable: Newable<IKinesisRecordHandler<Data>>): KinesisStreamHandler;
}

function embedKinesisEvent(event: KinesisStreamEvent): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/kinesis/event', (services) => {
    services.singleton<KinesisStreamEvent>(AwsServices.Event, event);
  });
}

function embedKinesisContext(context: Context): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/kinesis/context', (services) => {
    services.singleton<Context>(AwsServices.Context, context);
  });
}

function embedKinesisRecord(record: KinesisStreamRecord): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/kinesis/record', (services) => {
    services.singleton<KinesisStreamRecord>(KinesisLambdaServices.CurrentRecord, record);
  });
}

export const useTrigintaKinesis = createServiceModule('triginta/kinesis', (services) => {
  services.autoResolve<IKinesisLambdaFactory>(
    KinesisLambdaServices.KinesisLambdaFactory,
    KinesisLambdaFactory,
    Scopes.Transient,
  );

  services.autoResolve<IKinesisDataSerializer>(
    KinesisLambdaServices.DataSerializer,
    KinesisDataSerializer,
    Scopes.Transient,
  );

  services.autoResolve<IKinesisRecordFailureHandler>(
    KinesisLambdaServices.FailureHandler,
    KinesisRecordFailureHandler,
    Scopes.Transient,
  );
});

export class KinesisLambdaFactory implements IKinesisLambdaFactory {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  createHandler<Data>(newable: Newable<IKinesisRecordHandler<Data>>): KinesisStreamHandler {
    const handler = async (event: KinesisStreamEvent, context: Context) => {
      const response: KinesisStreamBatchResponse = {
        batchItemFailures: [],
      };

      for (let i = 0; i < event.Records.length; i++) {
        const record = event.Records[i];
        try {
          const { container } = resolveTrigintaRuntime<KinesisStreamEvent>(context);
          if (!container) {
            throw new Error('No container found in the context');
          }

          const childContainer = container.createChildContainer('sqsLambda', [
            embedKinesisEvent(event),
            embedKinesisRecord(record),
            embedKinesisContext(context),
          ]);

          try {
            const innerHandler = childContainer.resolve(newable);
            const deserializer = childContainer.get<IKinesisDataSerializer>(KinesisLambdaServices.DataSerializer);
            const message = await deserializer.deserializeRecord<Data>(record);

            await innerHandler.handle(message as Data, record, event);
          } catch (e) {
            const failureHandler = childContainer.get<IKinesisRecordFailureHandler>(
              KinesisLambdaServices.FailureHandler,
            );
            const shouldReport = await failureHandler.onError(record, e);

            if (shouldReport) {
              response.batchItemFailures.push({
                itemIdentifier: record.kinesis.sequenceNumber,
              });
            }
          } finally {
            if (childContainer) {
              try {
                childContainer.dispose();
              } catch {
                // no-op
              }
            }
          }
        } catch (e) {
          // We need to revisit this
          // https://github.com/aesop-fables/triginta/issues/199
          throw e;
        }
      }

      return response;
    };

    const middlewareMetadata = getMiddleware(newable) || [];
    return trigintafy(handler, middlewareMetadata, {
      container: this.container,
      source: 'sqs',
      overrides: [],
    });
  }
}

export function createBootstrappedKinesisLambdaContext(container: IServiceContainer): BootstrappedKinesisLambdaContext {
  return {
    createKinesisHandler<Data>(newable: Newable<IKinesisRecordHandler<Data>>): KinesisStreamHandler {
      if (typeof container === 'undefined') {
        throw new Error(`Kinesis container not initialized`);
      }

      const factory = container.get<IKinesisLambdaFactory>(KinesisLambdaServices.KinesisLambdaFactory);
      return factory.createHandler(newable);
    },
  };
}

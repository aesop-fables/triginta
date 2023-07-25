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
import { IS3RecordHandler } from './IS3RecordHandler';
import { getMiddleware } from '../Decorators';
import { S3LambdaServices } from './S3LambdaServices';
import { Context, S3Event, S3EventRecord, S3Handler } from 'aws-lambda';
import { AwsServices } from '../AwsServices';
import { resolveTrigintaRuntime, trigintafy } from '../TrigintaMiddleware';

export interface BootstrappedS3LambdaContext {
  createS3Handler(newable: Newable<IS3RecordHandler>): S3Handler;
}

export interface IS3LambdaFactory {
  createHandler(newable: Newable<IS3RecordHandler>): S3Handler;
}

function embedS3Event(event: S3Event): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/s3/event', (services) => {
    services.singleton<S3Event>(AwsServices.Event, event);
  });
}

function embedS3Context(context: Context): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/s3/context', (services) => {
    services.singleton<Context>(AwsServices.Context, context);
  });
}

function embedS3Record(record: S3EventRecord): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/s3/record', (services) => {
    services.singleton<S3EventRecord>(S3LambdaServices.CurrentRecord, record);
  });
}

export const useTrigintaS3 = createServiceModule('triginta/s3', (services) => {
  services.autoResolve<IS3LambdaFactory>(S3LambdaServices.S3LambdaFactory, S3LambdaFactory, Scopes.Transient);
});

export class S3LambdaFactory implements IS3LambdaFactory {
  constructor(@injectContainer() private readonly container: IServiceContainer) {}

  createHandler(newable: Newable<IS3RecordHandler>): S3Handler {
    const handler = async (event: S3Event, context: Context) => {
      for (let i = 0; i < event.Records.length; i++) {
        const { container } = resolveTrigintaRuntime<S3Event>(context);
        if (!container) {
          throw new Error('No container found in the context');
        }

        const record = event.Records[i];
        const childContainer = container.createChildContainer('s3Lambda', [
          embedS3Event(event),
          embedS3Record(record),
          embedS3Context(context),
        ]);
        try {
          const handler = childContainer.resolve(newable);
          await handler.handle(record, event);

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
      source: 's3',
      overrides: [],
    });
  }
}

export function createBootstrappedS3LambdaContext(container: IServiceContainer): BootstrappedS3LambdaContext {
  return {
    createS3Handler(newable: Newable<IS3RecordHandler>): S3Handler {
      if (typeof container === 'undefined') {
        throw new Error(`S3 container not initialized`);
      }

      const factory = container.get<IS3LambdaFactory>(S3LambdaServices.S3LambdaFactory);
      return factory.createHandler(newable);
    },
  };
}

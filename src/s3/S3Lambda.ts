/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createServiceModule, injectContainer, IServiceContainer, IServiceModule, Newable, Scopes } from '@aesop-fables/containr';
import middy from '@middy/core';
import { IS3RecordHandler } from './IS3RecordHandler';
import { getMiddleware } from '../Decorators';
import { S3LambdaServices } from './S3LambdaServices';
import { S3Event, S3EventRecord, S3Handler } from 'aws-lambda';

export interface BootstrappedS3LambdaContext {
  createS3Handler(newable: Newable<IS3RecordHandler>): S3Handler;
}

export interface IS3LambdaFactory {
  createHandler(newable: Newable<IS3RecordHandler>): S3Handler;
}

function embedS3Event(event: S3Event): IServiceModule {
  return createServiceModule('@aesop-fables/triginta/s3/event', (services) => {
    services.singleton<S3Event>(S3LambdaServices.CurrentEvent, event);
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
    const handler = async (event: S3Event) => {
      for (let i = 0; i < event.Records.length; i++) {
        const record = event.Records[i];
        const childContainer = this.container.createChildContainer('s3Lambda', [
          embedS3Event(event),
          embedS3Record(record),
        ]);
        try {
          const handler = childContainer.resolve(newable);
          await handler.handle(record, event);
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

    const middlewareMetadata = getMiddleware(newable);
    if (middlewareMetadata) {
      let midHandler = middy(handler);
      middlewareMetadata.forEach((midFunc: Function) => {
        midHandler = midHandler.use(midFunc());
      });
      return midHandler;
    }

    return handler;
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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createContainer,
  createServiceModule,
  IServiceContainer,
  IServiceModule,
  Newable,
} from '@aesop-fables/containr';
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import middy from '@middy/core';
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

export interface BootstrappedSqsLambdaContext {
  container: IServiceContainer;
  createHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler;
}

export interface ISqsLambdaFactory {
  createHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler;
}

export class SqsLambdaFactory implements ISqsLambdaFactory {
  constructor(private readonly container: IServiceContainer) {}

  createHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler {
    const handler = async (event: SQSEvent) => {
      const childContainer = this.container.createChildContainer('sqsLambda');
      try {
        const handler = childContainer.resolve(newable);
        const deserializer = childContainer.get<ISqsMessageDeserializer>(SqsLambdaServices.MessageDeserializer);
        for (let i = 0; i < event.Records.length; i++) {
          const record = event.Records[i];
          const message = await deserializer.deserializeMessage<Message>(record);
          await handler.handle(message as Message, record, event);
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

// Here until we fix containr's array stuff
// I think we might want to just use a different inject call for arrays
class NoOpMatcher implements ISqsRecordMatcher {
  matches(): boolean {
    return false;
  }
  deserializeMessage<Message extends ISqsMessage>(): Promise<Message> {
    throw new Error('Method not implemented.');
  }
}

export const useTrigintaSqs = createServiceModule('triginta/sqs', (services) => {
  services.register<ISqsLambdaFactory>(
    SqsLambdaServices.SqsLambdaFactory,
    (container) => new SqsLambdaFactory(container),
  );

  services.add<ISqsRecordMatcher>(SqsLambdaServices.RecordMatchers, NoOpMatcher);
  services.use<ISqsRecordMatcher>(SqsLambdaServices.DefaultRecordMatcher, DefaultSqsRecordMatcher);
  services.use<ISqsMessageDeserializer>(SqsLambdaServices.MessageDeserializer, SqsMessageDeserializer);
});

let _currentContainer: IServiceContainer | undefined;

export class SqsLambda {
  static initialize(modules: IServiceModule[] = []): BootstrappedSqsLambdaContext {
    const container = createContainer([useTrigintaSqs, ...modules]);
    _currentContainer = container;

    return {
      container,
      createHandler<Message extends ISqsMessage, Output extends SqsOutput = void>(
        newable: Newable<ISqsMessageHandler<Message, Output>>,
      ): SQSHandler {
        const factory = container.get<ISqsLambdaFactory>(SqsLambdaServices.SqsLambdaFactory);
        return factory.createHandler(newable);
      },
    };
  }

  static getContainer(): IServiceContainer {
    return _currentContainer as IServiceContainer;
  }
}

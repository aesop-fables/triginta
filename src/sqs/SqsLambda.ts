/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createContainer,
  createServiceModule,
  inject,
  IServiceContainer,
  IServiceModule,
  Newable,
} from '@aesop-fables/containr';
import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
import middy from '@middy/core';
import { ISqsMessageHandler, SqsOutput } from './ISqsMessageHandler';
import { getMiddleware } from '../Decorators';
import { SqsLambdaServices } from './SqsLambdaServices';

export interface BootstrappedSqsLambdaContext {
  createHandler<Message, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler;
}

export interface ISqsLambdaFactory {
  createHandler<Message, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler;
}

const jsonSafeParse = (text: any) => {
  if (typeof text !== 'string') return text;
  const firstChar = text[0];
  if (firstChar !== '{' && firstChar !== '[' && firstChar !== '"') return text;
  try {
    return JSON.parse(text);
  } catch (e) {}
  return text;
};

export class SqsLambdaFactory implements ISqsLambdaFactory {
  constructor(private readonly container: IServiceContainer) {}

  createHandler<Message, Output extends SqsOutput = void>(
    newable: Newable<ISqsMessageHandler<Message, Output>>,
  ): SQSHandler {
    const handler = async (event: SQSEvent) => {
      const childContainer = this.container.createChildContainer('sqsLambda');
      try {
        const handler = this.container.resolve(newable);
        for (let i = 0; i < event.Records.length; i++) {
          const record = event.Records[i];
          const message = jsonSafeParse(record.body);
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

export const useTrigintaSqs = createServiceModule('triginta/sqs', (services) => {
  services.register<ISqsLambdaFactory>(
    SqsLambdaServices.SqsLambdaFactory,
    (container) => new SqsLambdaFactory(container),
  );
});

let _currentContainer: IServiceContainer | undefined;

export class SqsLambda {
  static initialize(modules: IServiceModule[] = []): BootstrappedSqsLambdaContext {
    const container = createContainer([useTrigintaSqs, ...modules]);
    _currentContainer = container;

    return {
      createHandler<Message, Output extends SqsOutput = void>(
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

// // TRIGINTA
// interface ISqsEventMatcher {
//   matches(record: SQSRecord): boolean;
//   create(record: SQSRecord): Promise<any>;
// }

// interface ISqsMessageRegistry {
//   resolveMessage<T>(record: SQSRecord): Promise<T>;
// }

// // services.add<ISqsEventMatcher>('matchers', MySqsEventMatcher);
// // services.use<ISqsEventMatcher>('defaultMatcher', TRigintaDefaultSqs);

// class SqsMessageRegistry implements ISqsMessageRegistry {
//   constructor(
//     @inject('matchers') private readonly matchers: ISqsEventMatcher[],
//     @inject('default') private readonly defaultMatcher: ISqsEventMatcher,
//   ) {}

//   async resolveMessage<T>(record: SQSRecord): Promise<T> {
//     let matcher = this.defaultMatcher;
//     for (let i = 0; i < this.matchers.length; i++) {
//       const current = this.matchers[i];
//       if (matcher.matches(record)) {
//         matcher = current;
//       }
//     }

//     const result = await matcher.create(record);
//     return result;
//   }
// }

// Chris/Sam
// class StartJobEventMatcher implements ISqsEventMatcher {
//   matches(type: string): boolean {
//     return type === 'start-job';
//   }

//   create(record: SQSRecord) {
//     return new StartJobEvent(record.messageAttributes['X-Tenant'].stringValue ?? '', '');
//   }
// }

// SQS
//  SQSEvent => * SQSRecord
//  sqs.sendMessage()

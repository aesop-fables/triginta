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
import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyStructuredResultV2,
  Handler,
} from 'aws-lambda';
import middy from '@middy/core';
import { IHttpEndpoint } from './IHttpEndpoint';
import { getMiddleware } from './Decorators';
import { HttpLambdaServices } from './HttpLambdaServices';

export declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

export interface BootstrappedHttpLambdaContext {
  createHttpLambda<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
}

export interface IHttpLambdaFactory {
  // When we create the child container, do we need to be able to inject stuff?
  // e.g., "inject the current event for nested dependencies to have context" <-- This might be a "do it if/when we need it" kind of thing.
  createHandler<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
}

export class HttpLambdaFactory implements IHttpLambdaFactory {
  constructor(private readonly container: IServiceContainer) {}
  createHandler<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
    const handler = async (event: NonNoisyEvent) => {
      const childContainer = this.container.createChildContainer('httpLambda');
      try {
        const endpoint = this.container.resolve(newable);
        const { body: request } = event;

        const response = (await endpoint.handle(
          request as Input,
          event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
        )) as Output;

        // TODO -- Break this out into a response writer
        let proxyResponse = response as APIGatewayProxyStructuredResultV2;
        if (typeof proxyResponse?.statusCode === 'undefined') {
          // TODO -- Is 200 always correct here?
          proxyResponse = {
            statusCode: 200,
            body: response ? JSON.stringify(response) : undefined,
          };
        }

        return proxyResponse;
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

export const useTrigintaHttp = createServiceModule('triginta/http', (services) => {
  services.register<IHttpLambdaFactory>(
    HttpLambdaServices.HttpLambdaFactory,
    (container) => new HttpLambdaFactory(container),
  );
});

let _currentContainer: IServiceContainer | undefined;

export class HttpLambda {
  static initialize(modules: IServiceModule[] = []): BootstrappedHttpLambdaContext {
    const container = createContainer([useTrigintaHttp, ...modules]);
    _currentContainer = container;
    return {
      createHttpLambda<Input, Output>(
        newable: Newable<IHttpEndpoint<Input, Output>>,
      ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
        const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
        return factory.createHandler(newable);
      },
    };
  }

  static getContainer(): IServiceContainer {
    return _currentContainer as IServiceContainer;
  }
}

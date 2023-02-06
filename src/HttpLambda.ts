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
  Handler,
} from 'aws-lambda';
import middy from '@middy/core';
import { IHttpEndpoint } from './IHttpEndpoint';
import { getMiddleware } from './Decorators';
import { HttpLambdaServices } from './HttpLambdaServices';

export declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

// I'm leaning towards adopting a pattern where bootstrap.ts looks like:
// const { container, createHttpLambda } = HttpLambda.initialize([]);
// export { container, createHttpLambda };

// Ok, after the comment below and the pattern I'm leaning towards...
// I think it'll work like this:

// 1. Initialize a container (allow people to pass in service modules)
// 2. Resolve an instance of IHttpLambdaFactory
// 3. Use that to create the handler function itself (const handler = async(event))
// 4. Return a curried function: createHttpLambda

export interface BootstrappedHttpLambdaContext {
  createHttpLambda<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ): Handler<APIGatewayProxyEventV2, Output>;
}

export interface IHttpLambdaFactory {
  // Need to expose a way to create the handler
  // When we create the child container, do we need to be able to inject stuff?
  // e.g., "inject the current event for nested dependencies to have context" <-- This might be a "do it if/when we need it" kind of thing.
  createHandler<Input, Output>(newable: Newable<IHttpEndpoint<Input, Output>>): Handler<APIGatewayProxyEventV2, Output>;
}

export class HttpLambdaFactory implements IHttpLambdaFactory {
  constructor(private readonly container: IServiceContainer) {}
  createHandler<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ): Handler<APIGatewayProxyEventV2, Output> {
    const handler = async (event: NonNoisyEvent) => {
      const endpoint = this.container.resolve(newable);
      const { body: request } = event;

      const response = (await endpoint.handle(
        request as Input,
        event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
      )) as Output;

      return response;
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

export class HttpLambda {
  static initialize(modules: IServiceModule[] = []): BootstrappedHttpLambdaContext {
    const container = createContainer([useTrigintaHttp, ...modules]);
    return {
      createHttpLambda<Input, Output>(
        newable: Newable<IHttpEndpoint<Input, Output>>,
      ): Handler<APIGatewayProxyEventV2, Output> {
        const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
        return factory.createHandler(newable);
      },
    };
  }
}

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
import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  APIGatewayProxyStructuredResultV2,
  Handler,
} from 'aws-lambda';
import middy from '@middy/core';
import { IHttpEndpoint, IHttpEventHandler } from './IHttpEndpoint';
import { getMiddleware, getRoute } from './Decorators';
import { HttpLambdaServices } from './HttpLambdaServices';
import { IConfiguredRoute } from './IConfiguredRoute';

export declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

export interface BootstrappedHttpLambdaContext {
  createHttpEventLambda<Output>(
    newable: Newable<IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
  createHttpLambda<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
}

export interface IHttpLambdaFactory {
  createHandler<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output> | IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
  createEventHandler<Output>(
    newable: Newable<IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
}

export interface IHttpResponseGenerator {
  generateResponse(response?: any): Promise<APIGatewayProxyStructuredResultV2>;
}

export class HttpResponseGenerator implements IHttpResponseGenerator {
  constructor(@inject(HttpLambdaServices.CurrentRoute) private readonly configuredRoute: IConfiguredRoute) {}
  async generateResponse(response?: any): Promise<APIGatewayProxyStructuredResultV2> {
    const proxyResponse = response as APIGatewayProxyStructuredResultV2;
    if (typeof proxyResponse?.statusCode !== 'undefined') {
      return proxyResponse;
    }

    // TODO -- We should use the event to make this a little smarter
    const body = response ? JSON.stringify(response) : undefined;
    if (this.configuredRoute.method === 'get') {
      return {
        statusCode: 200,
        body,
      };
    }

    if (typeof response === 'undefined') {
      return {
        statusCode: 204,
        body: undefined,
      };
    }

    return {
      statusCode: 200,
      body,
    };
  }
}

export class HttpLambdaFactory implements IHttpLambdaFactory {
  constructor(private readonly container: IServiceContainer) {}
  createEventHandler<Output>(
    newable: Newable<IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
    return this.createHandler<any, Output>(newable);
  }
  createHandler<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output> | IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
    const handler = async (event: NonNoisyEvent) => {
      const route = getRoute(newable);
      if (!route) {
        throw new Error('No route found for the specified endpoint');
      }

      const injectConfiguredRoute: IServiceModule = {
        name: 'injectConfiguredRoute',
        configureServices(services) {
          services.register<IConfiguredRoute>(HttpLambdaServices.CurrentRoute, route);
        },
      };

      const childContainer = this.container.createChildContainer('httpLambda', [injectConfiguredRoute]);
      const responseGenerator = childContainer.get<IHttpResponseGenerator>(HttpLambdaServices.HttpResponseGenerator);
      try {
        const handler = this.container.resolve(newable);
        const { body: request } = event;

        let response: Output;
        if (route.method !== 'get') {
          const endpoint = handler as IHttpEndpoint<Input, Output>;
          response = (await endpoint.handle(
            request as Input,
            event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
          )) as Output;
        } else {
          const eventHandler = handler as IHttpEventHandler<Output>;
          response = (await eventHandler.handle(
            event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
          )) as Output;
        }

        return responseGenerator.generateResponse(response);
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
  services.use<IHttpResponseGenerator>(HttpLambdaServices.HttpResponseGenerator, HttpResponseGenerator);
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
      createHttpEventLambda<Output>(
        newable: Newable<IHttpEventHandler<Output>>,
      ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
        const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
        return factory.createEventHandler(newable);
      },
      createHttpLambda<Input, Output>(
        newable: Newable<IHttpEndpoint<Input, Output> | IHttpEventHandler<Output>>,
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

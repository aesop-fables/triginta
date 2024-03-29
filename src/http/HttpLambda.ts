/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createServiceModule,
  inject,
  injectContainer,
  IServiceContainer,
  Newable,
  Scopes,
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
import { getMiddleware, getRoute } from '../Decorators';
import { HttpLambdaServices } from './HttpLambdaServices';
import { IConfiguredRoute } from './IConfiguredRoute';
import { resolveTrigintaRuntime, trigintafy, trigintaMiddlware } from '../TrigintaMiddleware';
import { LoggingRegistry } from '../logging/LoggingRegistry';
import { CurrentRequestLoggingLevel } from '../logging/Levels';

export declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

export interface BootstrappedHttpLambdaContext {
  createHttpEventHandler<Output>(
    newable: Newable<IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
  createHttpHandler<Input, Output>(
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
  constructor(@injectContainer() private readonly container: IServiceContainer) {}
  createEventHandler<Output>(
    newable: Newable<IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
    return this.createHandler<any, Output>(newable);
  }
  createHandler<Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output> | IHttpEventHandler<Output>>,
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
    const route = getRoute(newable);
    if (!route) {
      throw new Error('No route found for the specified endpoint');
    }

    const handler = async (event: NonNoisyEvent, context: any) => {
      const childContainer = resolveTrigintaRuntime(context).container;
      if (!childContainer) {
        throw new Error('No container found in the context');
      }

      const responseGenerator = childContainer.get<IHttpResponseGenerator>(HttpLambdaServices.HttpResponseGenerator);
      const handler = childContainer.resolve(newable);
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
    };

    const { container } = this;
    const middlewareMetadata = getMiddleware(newable) ?? [];
    const httpRuntimeOverrides = createServiceModule('httpRuntimeOverrides', (services) => {
      services.singleton<IConfiguredRoute>(HttpLambdaServices.CurrentRoute, route);

      // TODO -- Register the AwsServices
    });

    return trigintafy(handler, middlewareMetadata, {
      container,
      source: 'http',
      overrides: [httpRuntimeOverrides],
    });
  }
}

export const useTrigintaHttp = createServiceModule('triginta/http', (services) => {
  services.autoResolve<IHttpResponseGenerator>(
    HttpLambdaServices.HttpResponseGenerator,
    HttpResponseGenerator,
    Scopes.Transient,
  );
  services.autoResolve<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory, HttpLambdaFactory, Scopes.Transient);
  services.include(new LoggingRegistry(CurrentRequestLoggingLevel));
});

function validateContainer(container: IServiceContainer): void {
  if (typeof container === 'undefined') {
    throw new Error(`HTTP container not initialized`);
  }
}

export function createBootstrappedHttpLambdaContext(container: IServiceContainer): BootstrappedHttpLambdaContext {
  return {
    createHttpEventHandler<Output>(
      newable: Newable<IHttpEventHandler<Output>>,
    ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
      validateContainer(container);
      const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
      return factory.createEventHandler(newable);
    },
    createHttpHandler<Input, Output>(
      newable: Newable<IHttpEndpoint<Input, Output> | IHttpEventHandler<Output>>,
    ): Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
      validateContainer(container);
      const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
      return factory.createHandler(newable);
    },
  };
}

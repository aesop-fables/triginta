/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IServiceContainer, Newable } from '@aesop-fables/containr';
import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
} from 'aws-lambda';
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { IHttpEndpoint } from './IHttpEndpoint';

declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

export interface IConfiguredMiddleware {
  constructor: Function;
  middleware: any;
}

const middlewareMetadataKey = Symbol('@middlewareMetadataKey');
export function useMiddleware(...args: any[]) {
  return (target: Object): void => {
    const params: IConfiguredMiddleware = { middleware: args, constructor: target as Function };
    Reflect.defineMetadata(middlewareMetadataKey, params, target);
    // if (args.length && args[0] === 'httpJsonBodyParser') {
    // }
  };
}

export function getMiddleware(target: any): IConfiguredMiddleware | undefined {
  return Reflect.getMetadata(middlewareMetadataKey, target);
}

export function createHttpLambda<Input, Output>(
  newable: Newable<IHttpEndpoint<Input, Output>>,
  container: IServiceContainer,
): Handler<APIGatewayProxyEventV2, Output> {
  const handler = async (event: NonNoisyEvent) => {
    const endpoint = container.resolve(newable);
    const { body: request } = event;

    const response = (await endpoint.handle(
      request as Input,
      event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
    )) as Output;

    return response;
  };
  const middlewareMetadata = getMiddleware(newable);
  if (middlewareMetadata) {
    console.log('use middy');
    let midHandler = middy(handler);
    middlewareMetadata?.middleware.forEach((midFunc: Function) => {
      midHandler = midHandler.use(midFunc());
    });
    return midHandler;
  }

  return handler;
}

export interface InvokeHttpHandlerOptions<Request = any> {
  body?: Request;
  headers?: APIGatewayProxyEventHeaders;
}

export async function invokeHttpHandler<Request, Output>(
  handler: Handler<APIGatewayProxyEventV2, Output>,
  options: InvokeHttpHandlerOptions<Request>,
): Promise<Output> {
  const configuredHandler = handler as Handler<NonNoisyEvent, Output>;

  // TODO -- Make this smart enough to determine the HTTP verb/route
  // And parse out the query string params, route params, etc? Or is that done in middyjs?
  // Also, we probably want to expose stuff for cookies/etc
  const headers = options.headers ?? {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  return new Promise<Output>((resolve) => {
    configuredHandler(
      {
        headers,
        body: options.body ? JSON.stringify(options.body ?? {}) : undefined,
        version: '',
        routeKey: '',
        rawPath: '',
        rawQueryString: '',
        isBase64Encoded: false,
      },
      {
        callbackWaitsForEmptyEventLoop: false,
        functionName: '',
        functionVersion: '',
        invokedFunctionArn: '',
        memoryLimitInMB: '',
        awsRequestId: '',
        logGroupName: '',
        logStreamName: '',
        getRemainingTimeInMillis: function (): number {
          throw new Error('Function not implemented.');
        },
        done: function (error?: Error | undefined, result?: any): void {
          throw new Error('Function not implemented.');
        },
        fail: function (error: string | Error): void {
          throw new Error('Function not implemented.');
        },
        succeed: function (messageOrObject: any): void {
          throw new Error('Function not implemented.');
        },
      },
      (error, res) => {
        resolve(res as Output);
      },
    );
  });
}

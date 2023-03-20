/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Handler,
} from 'aws-lambda';
import { HttpLambda, IHttpLambdaFactory, NonNoisyEvent } from './HttpLambda';
import queryString from 'node:querystring';
import { HttpLambdaServices } from './HttpLambdaServices';
import { IServiceContainer, Newable } from '@aesop-fables/containr';
import { IHttpEndpoint } from './IHttpEndpoint';
import { IConfiguredRoute } from './IConfiguredRoute';
import middy from '@middy/core';

//Omit<APIGatewayProxyEventV2, 'container' | 'body'> & { body?: any }
declare type InvocableEvent = Omit<APIGatewayProxyEventV2, 'body'> & { body: any };
export interface InvocationContext extends Partial<InvocableEvent> {
  configuredRoute: IConfiguredRoute;
  container: IServiceContainer;
}

function normalizeAndParse(input: string): string[] {
  let valueToParse = input;
  if (valueToParse.endsWith('/')) {
    valueToParse = valueToParse.substring(0, valueToParse.length - 1);
  }

  if (!valueToParse.startsWith('/')) {
    valueToParse = `/${valueToParse}`;
  }

  return valueToParse.split('/').filter((x) => x.trim() !== '');
}

export function parseRouteParams(route: string, path: string): APIGatewayProxyEventPathParameters {
  let routeToParse = route;
  if (routeToParse.endsWith('/')) {
    routeToParse = routeToParse.substring(0, routeToParse.length - 1);
  }

  if (!routeToParse.startsWith('/')) {
    routeToParse = `/${routeToParse}`;
  }

  const routeParts = normalizeAndParse(route);
  const pathParts = normalizeAndParse(path);

  if (routeParts.length !== pathParts.length) {
    throw new Error(`Missing route parameters`);
  }

  const params: APIGatewayProxyEventPathParameters = {};
  for (let i = 0; i < routeParts.length; i++) {
    const part = routeParts[i];
    const result = /\{([\w]*)\}/g.exec(part);
    if (result) {
      const paramKey = result[1];
      const value = pathParts[i];

      params[paramKey] = value;
    }
  }

  return params;
}

export function parsePathParameters(context: EventGenerationContext): Partial<APIGatewayProxyEventV2> {
  const { rawPath } = context;
  let queryStringParameters = {};
  if (rawPath?.indexOf('?') !== -1) {
    const values = rawPath?.split('?') ?? [];
    if (values.length > 1) {
      queryStringParameters = queryString.parse(values[1]);
    }
  }

  return {
    rawPath,
    pathParameters: parseRouteParams(context.configuredRoute.route, context.rawPath as string),
    queryStringParameters,
  };
}

export declare type EventGenerationContext = Omit<InvocationContext, 'container'>;

function stringOrJsonStringify(input?: any): string | undefined {
  if (typeof input === 'undefined') {
    return undefined;
  }

  if (typeof input === 'string') {
    return input;
  }

  return JSON.stringify(input);
}

const DEFAULT_HEADERS = {
  accept: '*/*',
  'accept-encoding': 'gzip, deflate, br',
  // 'content-length': '0',
  'content-type': 'application/json',
  host: '',
  'user-agent': 'triginta/1.0',
  'x-amzn-trace-id': 'Root=1-63e26f79-577a8db87d3b31fa4da65566',
  'x-forwarded-for': '127.0.0.1',
  'x-forwarded-port': '80',
  'x-forwarded-proto': 'http',
};

export function createApiGatewayEvent(context: EventGenerationContext): Partial<APIGatewayProxyEventV2> {
  const { configuredRoute, rawPath, body, headers } = context;
  const routeKey = `${configuredRoute.method} ${configuredRoute.route}`;
  const event: Partial<APIGatewayProxyEventV2> = {
    version: '2.0',
    routeKey,
    headers: { ...DEFAULT_HEADERS, ...headers },
    requestContext: {
      accountId: '888888888888',
      apiId: 'trigintaLocal',
      domainName: '',
      domainPrefix: '',
      http: {
        method: configuredRoute.method,
        path: rawPath ?? '',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'triginta/1.0',
      },
      requestId: '1234',
      routeKey,
      stage: '$default',
      time: '',
      timeEpoch: Date.now(),
    },
    body: stringOrJsonStringify(body),
    ...parsePathParameters(context),
  };

  return event;
}

// TODO -- We need to rename this to make it clear that it's for testing ONLY
export async function invokeHttpHandler<Output>(
  context: InvocationContext,
): Promise<APIGatewayProxyStructuredResultV2> {
  const { container } = context;
  const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
  const configuredHandler = factory.createHandler(
    context.configuredRoute.constructor as Newable<IHttpEndpoint<any, any>>,
  ) as middy.MiddyfiedHandler<NonNoisyEvent, APIGatewayProxyStructuredResultV2>;

  const event = createApiGatewayEvent(context) as NonNoisyEvent;
  const handlerContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'httpLambda',
    functionVersion: '0.1',
    invokedFunctionArn: 'arn::test',
    memoryLimitInMB: '128',
    awsRequestId: '1234',
    logGroupName: 'test-group',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: function (): number {
      return 1000;
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
  };

  const response = await configuredHandler(event, handlerContext);
  return response;
}

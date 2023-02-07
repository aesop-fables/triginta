/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventV2,
  Handler,
} from 'aws-lambda';
import { IConfiguredRoute } from './Decorators';
import { HttpLambda, IHttpLambdaFactory, NonNoisyEvent } from './HttpLambda';
import queryString from 'node:querystring';
import { HttpLambdaServices } from './HttpLambdaServices';
import { Newable } from '@aesop-fables/containr';
import { IHttpEndpoint } from './IHttpEndpoint';

export interface InvocationContext {
  configuredRoute: IConfiguredRoute;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  path: string;

  // Possibly smuggle any options that the consumer passed
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

export function parsePathParameters(context: InvocationContext): Partial<APIGatewayProxyEventV2> {
  const { path } = context;
  let queryStringParameters = {};
  if (path.indexOf('?') !== -1) {
    const values = path.split('?');
    if (values.length > 1) {
      queryStringParameters = queryString.parse(values[1]);
    }
  }

  return {
    rawPath: path,
    pathParameters: parseRouteParams(context.configuredRoute.route, context.path),
    queryStringParameters,
  };
}

export function createApiGatewayEvent(context: InvocationContext): Partial<APIGatewayProxyEventV2> {
  const { configuredRoute, path, body } = context;
  const routeKey = `${configuredRoute.method} ${configuredRoute.route}`;
  const event: Partial<APIGatewayProxyEventV2> = {
    version: '2.0',
    routeKey,
    headers: {
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
      // 'content-length': '0',
      // 'content-type': 'application/json',
      host: '',
      'user-agent': 'triginta/1.0',
      'x-amzn-trace-id': 'Root=1-63e26f79-577a8db87d3b31fa4da65566',
      'x-forwarded-for': '127.0.0.1',
      'x-forwarded-port': '80',
      'x-forwarded-proto': 'http',
    },
    requestContext: {
      accountId: '888888888888',
      apiId: 'trigintaLocal',
      domainName: '',
      domainPrefix: '',
      http: {
        method: configuredRoute.method,
        path,
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
    body: body ? JSON.stringify(body) : undefined,
  };

  return event;
}

// TODO -- We need to rename this to make it clear that it's for testing ONLY
export async function invokeHttpHandler<Output>(context: InvocationContext): Promise<Output> {
  const container = HttpLambda.getContainer();
  const factory = container.get<IHttpLambdaFactory>(HttpLambdaServices.HttpLambdaFactory);
  const configuredHandler = factory.createHandler(
    context.configuredRoute.constructor as Newable<IHttpEndpoint<any, any>>,
  ) as Handler<NonNoisyEvent, Output>;

  return configuredHandler(
    createApiGatewayEvent(context) as NonNoisyEvent,
    {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'httpLambda',
      functionVersion: '0.1',
      invokedFunctionArn: 'arn::test',
      memoryLimitInMB: '128',
      awsRequestId: '1234',
      logGroupName: 'test-group',
      logStreamName: 'test-stream',
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
    () => {
      // no-op
      throw new Error('Not supported');
    },
  ) as Promise<Output>;
}

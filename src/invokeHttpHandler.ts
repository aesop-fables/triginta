import { APIGatewayProxyEventHeaders, APIGatewayProxyEventV2, Handler } from 'aws-lambda';
import { NonNoisyEvent } from './HttpLambda';

export interface InvokeHttpHandlerOptions<Request = any> {
  body?: Request;
  headers?: APIGatewayProxyEventHeaders;
}

// TODO -- We need to rename this to make it clear that it's for testing ONLY
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

  return configuredHandler(
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
    () => {
      // no-op
      throw new Error('Not supported');
    },
  ) as Promise<Output>;
}

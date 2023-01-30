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
import { IHttpEndpoint } from './IHttpEndpoint';
import { getMiddleware } from './Decorators';

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

export function createHttpLambda<Input, Output>(
  newable: Newable<IHttpEndpoint<Input, Output>>,
  container: IServiceContainer,
): Handler<APIGatewayProxyEventV2, Output> {
  // I'm willing to bet good money that we/someone will need
  // this handler logic  to vary
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
    middlewareMetadata.forEach((midFunc: Function) => {
      midHandler = midHandler.use(midFunc());
    });
    return midHandler;
  }

  return handler;
}

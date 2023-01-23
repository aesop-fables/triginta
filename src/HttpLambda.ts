import { IServiceContainer, Newable } from '@aesop-fables/containr';
import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
} from 'aws-lambda';
import middy from 'middy';
import { jsonBodyParser } from 'middy/middlewares';
import { IHttpEndpoint } from './IHttpEndpoint';

export declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

export function createHttpLambda<Input, Output>(
  newable: Newable<IHttpEndpoint<Input, Output>>,
  container: IServiceContainer,
): Handler<NonNoisyEvent, Output> {
  const handler = async (event: NonNoisyEvent) => {
    const endpoint = container.resolve(newable);
    const { body: request } = event;

    const response = (await endpoint.handle(
      request as Input,
      event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
    )) as Output;

    return response;
  };

  return middy(handler).use(jsonBodyParser());
}

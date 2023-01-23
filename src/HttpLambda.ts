import { IServiceContainer, Newable } from '@aesop-fables/containr';
import {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithRequestContext,
  Handler,
} from 'aws-lambda';
import middy from 'middy';
import { jsonBodyParser } from 'middy/middlewares';
import { IHandler } from './IHandler';
import { IHttpEndpoint } from './IHttpEndpoint';

export declare type NonNoisyEvent = Omit<APIGatewayProxyEventV2, 'requestContext'>;

export function createHttpLambda<Input, Output>(
  newable: Newable<IHttpEndpoint<Input, Output>>,
  container: IServiceContainer,
): Handler<NonNoisyEvent, Output> {
  const hasndler = async (event: NonNoisyEvent) => {
    const endpoint = container.resolve(newable);
    const { body: request } = event;

    console.log(JSON.stringify(request));

    const response = (await endpoint.handle(
      request as Input,
      event as unknown as APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>,
    )) as Output;

    console.log('response!', response);
    return response;
  };

  const bob = middy(hasndler).use(jsonBodyParser());

  bob.before((handler, next) => {
    console.log('before', handler.response);
    // do something in the before phase
    next();
  });

  bob.after((handler, next) => {
    console.log('after', handler.response);
    // do something in the after phase
    next();
  });

  bob.onError((handler, next) => {
    console.log('error');
    // do something in the on error phase
    next();
  });

  return bob;
}

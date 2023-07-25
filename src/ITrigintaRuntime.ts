import { Disposable, IServiceContainer } from '@aesop-fables/containr';
import { EventSource } from './EventSource';
import { APIGatewayEventRequestContextV2, APIGatewayProxyEventV2, Context, S3Event, SQSEvent } from 'aws-lambda';

export interface ITrigintaRuntime<TEvent, TContext> extends Disposable {
  container: IServiceContainer;
  context: TContext;
  event: TEvent;
  source: EventSource;
}

export declare type ITrigintaHttpRuntime = ITrigintaRuntime<APIGatewayProxyEventV2, APIGatewayEventRequestContextV2>;
export declare type ITrigintaS3Runtime = ITrigintaRuntime<S3Event, Context>;
export declare type ITrigintaSqsRuntime = ITrigintaRuntime<SQSEvent, Context>;

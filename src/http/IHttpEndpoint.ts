import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IEventHandler, IMessageHandler } from '../IHandler';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IHttpEventHandler<Output = void> extends IEventHandler<APIGatewayProxyEventV2, Output> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IHttpEndpoint<Input, Output> extends IMessageHandler<Input, APIGatewayProxyEventV2, Output> {}

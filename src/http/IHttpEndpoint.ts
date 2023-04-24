import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IEventHandler, IMessageHandler } from '../IHandler';

export interface IHttpEventHandler<Output = void> extends IEventHandler<APIGatewayProxyEventV2, Output> {}

export interface IHttpEndpoint<Input, Output> extends IMessageHandler<Input, APIGatewayProxyEventV2, Output> {}

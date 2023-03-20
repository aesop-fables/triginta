import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IMessageHandler } from './IHandler';

export interface IHttpEndpoint<Input, Output> extends IMessageHandler<Input, APIGatewayProxyEventV2, Output> {}

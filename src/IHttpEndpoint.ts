import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IHandler } from './IHandler';

export interface IHttpEndpoint<Input, Output> extends IHandler<Input, APIGatewayProxyEventV2, Output> {}

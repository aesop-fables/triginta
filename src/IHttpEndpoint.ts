import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IHandler } from './IHandler';

export interface IHttpEndpoint<Request> extends IHandler<Request, APIGatewayProxyEventV2> {}

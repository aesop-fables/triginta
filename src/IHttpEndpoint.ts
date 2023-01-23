import { executionAsyncResource } from 'async_hooks';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IHandler } from './IHandler';

export interface IHttpEndpoint<Input, Output> extends IHandler<Request, APIGatewayProxyEventV2> 
{
  execute(request: Input): Promise<Output>;
}

import { executionAsyncResource } from 'async_hooks';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { IHandler } from './IHandler';

export interface IHttpEndpoint<ExecuteQueryRequest, ExecuteQueryResults> extends IHandler<Request, APIGatewayProxyEventV2> 
{
  execute(request: ExecuteQueryRequest): Promise<ExecuteQueryResults>;
}
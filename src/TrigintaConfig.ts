import { IServiceContainer, Newable } from '@aesop-fables/containr';
import { Handler, APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { IHttpEndpoint } from './IHttpEndpoint';

export declare type TrigintaConfig = {
  container: IServiceContainer;
  createHttpLambda: <Input, Output>(
    newable: Newable<IHttpEndpoint<Input, Output>>,
  ) => Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
};

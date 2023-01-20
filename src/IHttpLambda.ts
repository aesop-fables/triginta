import { Handler, S3EventRecord } from 'aws-lambda';
import { IHandler } from './IHandler';
import { IHttpEndpoint } from './IHttpEndpoint';
import { IServiceContainer, Newable } from "@aesop-fables/containr";

export interface IHttpLambda {
  createHttpLambda<Input, Output>(lambdaClass: Newable<IHttpEndpoint<Input, Output>>, container: IServiceContainer): Handler;
}

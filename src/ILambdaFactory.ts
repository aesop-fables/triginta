import { Handler, S3EventRecord } from 'aws-lambda';
import { IHandler } from './IHandler';
import { IHttpEndpoint } from './IHttpEndpoint';
import { IServiceContainer, Newable } from "@aesop-fables/containr";

export interface LambdaOptions<Message> {
  factory: () => IHandler<Message>;
}

export interface KinesisLambdaOptions<Message> extends LambdaOptions<Message> {}
export interface S3LambdaOptions<Message> extends LambdaOptions<Message> {}
export interface SqsLambdaOptions<Message> extends LambdaOptions<Message> {}
export interface createHttpLambda<ExecuteQueryRequest, ExecuteQueryResults> extends LambdaOptions<ExecuteQueryRequest> {}

export interface ILambdaFactory {
  createKinesisLambda<Message>(options: KinesisLambdaOptions<Message>): Handler;
  createS3Lambda(options: S3LambdaOptions<S3EventRecord>): Handler;
  createSqsLambda<Message>(options: SqsLambdaOptions<Message>): Handler;
  createHttpLambda<ExecuteQueryRequest, ExecuteQueryResults>(lambdaClass: Newable<IHttpEndpoint<ExecuteQueryRequest, ExecuteQueryResults>>, container: IServiceContainer): Handler;
}

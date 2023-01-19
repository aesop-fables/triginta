import { Handler, S3EventRecord } from 'aws-lambda';
import { IHandler } from './IHandler';

export interface LambdaOptions<Message> {
  factory: () => IHandler<Message>;
}

export interface KinesisLambdaOptions<Message> extends LambdaOptions<Message> {}
export interface S3LambdaOptions<Message> extends LambdaOptions<Message> {}
export interface SqsLambdaOptions<Message> extends LambdaOptions<Message> {}
export interface HttpLambdaOptions<Message> extends LambdaOptions<Message> {}

export interface ILambdaFactory {
  createKinesisLambda<Message>(options: KinesisLambdaOptions<Message>): Handler;
  createS3Lambda(options: S3LambdaOptions<S3EventRecord>): Handler;
  createSqsLambda<Message>(options: SqsLambdaOptions<Message>): Handler;
  createHttpLambda<Message>(options: HttpLambdaOptions<Message>): Handler;
}

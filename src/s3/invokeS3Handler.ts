/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { S3Event } from 'aws-lambda';
import { IServiceContainer, Newable } from '@aesop-fables/containr';
import middy from '@middy/core';
import { IS3LambdaFactory } from './S3Lambda';
import { S3LambdaServices } from './S3LambdaServices';
import { IS3RecordHandler } from './IS3RecordHandler';

export interface S3InvocationContext extends Partial<S3Event> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  handler: Function;
  container: IServiceContainer;
}

/**
 * Invokes a lambda by constructing it from the specified container
 * @param context
 * @returns
 */
export async function invokeS3Handler(context: S3InvocationContext): Promise<void> {
  const { container } = context;
  const factory = container.get<IS3LambdaFactory>(S3LambdaServices.S3LambdaFactory);
  const configuredHandler = factory.createHandler(
    context.handler as Newable<IS3RecordHandler>,
  ) as middy.MiddyfiedHandler<S3Event>;

  context.Records?.forEach((record) => {
    if (!record.eventSource) {
      record.eventSource = 'aws:s3';
    }
  });

  const event: S3Event = { ...context, handler: undefined, container: undefined } as S3Event;
  const handlerContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 's3Lambda',
    functionVersion: '0.1',
    invokedFunctionArn: 'arn::test',
    memoryLimitInMB: '128',
    awsRequestId: '1234',
    logGroupName: 'test-group',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: function (): number {
      return 1000;
    },
    done: function (error?: Error | undefined, result?: any): void {
      throw new Error('Function not implemented.');
    },
    fail: function (error: string | Error): void {
      throw new Error('Function not implemented.');
    },
    succeed: function (messageOrObject: any): void {
      throw new Error('Function not implemented.');
    },
  };

  const response = await configuredHandler(event, handlerContext);
  return response;
}

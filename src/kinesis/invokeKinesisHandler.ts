/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { KinesisStreamBatchResponse, KinesisStreamEvent } from 'aws-lambda';
import { IServiceContainer, Newable } from '@aesop-fables/containr';
import middy from '@middy/core';
import { IKinesisLambdaFactory } from './KinesisLambda';
import { KinesisLambdaServices } from './KinesisLambdaServices';
import { IKinesisRecordHandler } from './IKinesisRecordHandler';

export interface KinesisInvocationContext extends Partial<KinesisStreamEvent> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  handler: Function;
  container: IServiceContainer;
}

/**
 * Invokes a lambda by constructing it from the specified container
 * @param context
 * @returns
 */
export async function invokeKinesisHandler(context: KinesisInvocationContext): Promise<KinesisStreamBatchResponse> {
  const { container } = context;
  const factory = container.get<IKinesisLambdaFactory>(KinesisLambdaServices.KinesisLambdaFactory);
  const configuredHandler = factory.createHandler(
    context.handler as Newable<IKinesisRecordHandler<any>>,
  ) as middy.MiddyfiedHandler<KinesisStreamEvent>;

  context.Records?.forEach((record) => {
    if (!record.eventSource) {
      record.eventSource = 'aws:kinesis';
    }
  });

  const event = { ...context, handler: undefined, container: undefined } as KinesisStreamEvent;
  const handlerContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'kinesisLambda',
    functionVersion: '0.1',
    invokedFunctionArn: 'arn::test',
    memoryLimitInMB: '128',
    awsRequestId: '1234',
    logGroupName: 'test-group',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: function (): number {
      return 5000;
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

  const response = (await configuredHandler(event, handlerContext)) as KinesisStreamBatchResponse;
  return response;
}

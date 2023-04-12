/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Handler,
  SQSEvent,
} from 'aws-lambda';
import { HttpLambda, IHttpLambdaFactory, NonNoisyEvent } from './HttpLambda';
import queryString from 'node:querystring';
import { HttpLambdaServices } from './HttpLambdaServices';
import { IServiceContainer, Newable } from '@aesop-fables/containr';
import { IHttpEndpoint } from './IHttpEndpoint';
import { IConfiguredRoute } from './IConfiguredRoute';
import middy from '@middy/core';
import { ISqsLambdaFactory } from './SqsLambda';
import { SqsLambdaServices } from './SqsLambdaServices';
import { ISqsMessageHandler } from './ISqsMessageHandler';

export interface SqsInvocationContext extends Partial<SQSEvent> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  handler: Function;
  container: IServiceContainer;
}
// TODO -- We need to rename this to make it clear that it's for testing ONLY
export async function invokeSqsHandler(context: SqsInvocationContext): Promise<void> {
  const { container } = context;
  const factory = container.get<ISqsLambdaFactory>(SqsLambdaServices.SqsLambdaFactory);
  const configuredHandler = factory.createHandler(
    context.handler as Newable<ISqsMessageHandler<any, any>>,
  ) as middy.MiddyfiedHandler<SQSEvent>;

  context.Records?.forEach((record) => {
    if (!record.eventSource) {
      record.eventSource = 'aws:sqs';
    }
  });

  const event = { ...context, handler: undefined, container: undefined } as SQSEvent;
  const handlerContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'sqsLambda',
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

import { createContainer } from '@aesop-fables/containr';
import { rejects } from 'assert';
import { APIGatewayProxyEventV2, KinesisStreamEvent } from 'aws-lambda';
import { IHandler, IHttpEndpoint, runKinesisScenario } from '..';
import { createHttpLambda, NonNoisyEvent } from '../HttpLambda';

// declare type Shutup = Omit<Handler<APIGatewayProxyEventV2>, 'requestConfig'>

describe('createHttpLambda', () => {
  interface CreateStatusAlertRequest {
    app: string;
    version: string;
    region: string;
    message: string;
    active: boolean;
  }

  interface StatusAlert {
    id: string;
    app: string;
    version: string;
    region: string;
    message: string;
    active: boolean;
  }

  class CreateStatusAlertEndpoint implements IHttpEndpoint<CreateStatusAlertRequest, StatusAlert> {
    request?: CreateStatusAlertRequest;
    event?: NonNoisyEvent;

    async handle(request: CreateStatusAlertRequest, event: NonNoisyEvent): Promise<StatusAlert> {
      this.request = request;
      this.event = event;

      return {
        id: '123',
        ...request,
      };
    }
  }

  test('Test the IHttpEndpoint handler', async () => {
    const request: CreateStatusAlertRequest = {
      app: 'Agent',
      version: '1.0',
      region: 'us-west',
      message: 'Stop the presses!',
      active: true,
    };

    const container = createContainer([]);
    const handler = createHttpLambda(CreateStatusAlertEndpoint, container);

    const response = await new Promise((resolve) => {
      handler(
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(request),
          version: '',
          routeKey: '',
          rawPath: '',
          rawQueryString: '',
          isBase64Encoded: false,
        },
        {
          callbackWaitsForEmptyEventLoop: false,
          functionName: '',
          functionVersion: '',
          invokedFunctionArn: '',
          memoryLimitInMB: '',
          awsRequestId: '',
          logGroupName: '',
          logStreamName: '',
          getRemainingTimeInMillis: function (): number {
            throw new Error('Function not implemented.');
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
        },
        (error, res) => {
          resolve(res);
        },
      );
    });

    expect(response).toEqual({
      id: '123',
      ...request,
    });
  });
});

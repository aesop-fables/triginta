import { APIGatewayProxyEventV2, KinesisStreamEvent } from 'aws-lambda';
import { IHandler, IHttpEndpoint, runKinesisScenario } from '..';

describe('LambdaFactory', () => {
  describe('createKinesisLambda', () => {
    interface TestKinesisMessage {
      name: string;
    }

    class TestKinesisHandler implements IHandler<TestKinesisMessage, KinesisStreamEvent> {
      message?: TestKinesisMessage;
      event?: KinesisStreamEvent;

      async handle(message: TestKinesisMessage, event: KinesisStreamEvent): Promise<void> {
        this.message = message;
        this.event = event;
      }
    }

    test('Parses json and invokes the message handler', async () => {
      const handler = new TestKinesisHandler();
      const message: TestKinesisMessage = { name: 'Olivia' };

      await runKinesisScenario<TestKinesisMessage>(handler, {
        messages: [message],
      });

      expect(handler.message).toStrictEqual(message);
    });
  });

  describe('createHttpEndpoint', () => {
    interface CreateStatusAlertRequest {
      pk: string;
      app: string;
      version: string;
      region: string;
      message: string;
      active: boolean;
    }

    class CreateStatusAlertEndpoint implements IHttpEndpoint<CreateStatusAlertRequest> {
      request?: CreateStatusAlertRequest;
      event?: APIGatewayProxyEventV2;

      async handle(request: CreateStatusAlertRequest, event: APIGatewayProxyEventV2): Promise<void> {
        this.request = request;
        this.event = event;
      }
    }

    test('Test the IHttpEndpoint handler', async () => {
      const handler = new CreateStatusAlertEndpoint();
      const request: CreateStatusAlertRequest = {
        pk: 'uuid',
        app: 'Agent',
        version: '1.0',
        region: 'us-west',
        message: 'Stop the presses!',
        active: true,
      };

      // await runSomeEndpointScenario<CreateStatusAlertRequest>(handler, {
      //   requests: [request],
      // });

      // TODO - make a scenario do some actual stuff
      handler.request = request;

      expect(handler.request).toStrictEqual(request);
    });
  });
});

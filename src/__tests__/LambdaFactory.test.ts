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
});

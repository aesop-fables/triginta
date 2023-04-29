import 'reflect-metadata';
import { createContainer, createServiceModule, inject } from '@aesop-fables/containr';
import { httpPost, useMiddleware } from '../../Decorators';
import { IHttpEndpoint } from '../../http/IHttpEndpoint';
import jsonBodyParser from '@middy/http-json-body-parser';
import { HttpLambda } from '../../http/HttpLambda';
import { invokeHttpHandler } from '../../http/invokeHttpHandler';
import { APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { Validation } from '../..';

const { validate } = Validation;

const RECORDER_KEY = 'eventRecorder';

interface IEndpointRecorder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordRequest(request: any): void;
}

interface TestModel {
  firstName: string;
}

const rules = Validation.parseRules<TestModel>({
  firstName: {
    required: true,
  },
});

@httpPost('/triginta/middlware/validation')
@useMiddleware(jsonBodyParser, validate(rules))
class ValidationTestEndpoint implements IHttpEndpoint<TestModel, void> {
  constructor(@inject(RECORDER_KEY) private readonly events: IEndpointRecorder) {}
  async handle(model: TestModel): Promise<void> {
    this.events.recordRequest(model);
  }
}

describe('Validator', () => {
  describe('integration', () => {
    test('registers message for missing required field', async () => {
      const validator = new Validation.Validator(createContainer([]), rules);
      const notification = await validator.validate({} as TestModel);

      const messages = notification.messagesFor('firstName');
      expect(messages.length).toBe(1);
      expect(messages[0].field).toBe('firstName');
      expect(messages[0].localizedString).toBe(Validation.ValidationKeys.Required);

      expect(notification.messagesFor('lastName').length).toBe(0);
    });
  });

  describe('http integration', () => {
    test('registers message for missing required field', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];

      HttpLambda.initialize([
        createServiceModule('test', (services) => {
          services.register<IEndpointRecorder>(RECORDER_KEY, {
            recordRequest(request) {
              messages.push(request);
            },
          });
        }),
      ]);

      const container = HttpLambda.getContainer();
      const body: TestModel = {
        firstName: '',
      };

      const response = (await invokeHttpHandler<APIGatewayProxyResultV2>({
        configuredRoute: {
          constructor: ValidationTestEndpoint,
          method: 'post',
          route: '/triginta/middlware/validation',
        },
        container,
        rawPath: '/triginta/middlware/validation',
        body,
      })) as APIGatewayProxyStructuredResultV2;

      expect(messages.length).toBe(0);
      expect(response.statusCode).toEqual(400);
    });
  });
});

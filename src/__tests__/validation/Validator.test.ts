import 'reflect-metadata';
import { Scopes, ServiceCollection, createContainer, createServiceModule, inject } from '@aesop-fables/containr';
import { httpPost, useMiddleware } from '../../Decorators';
import { IHttpEndpoint } from '../../http/IHttpEndpoint';
import jsonBodyParser from '@middy/http-json-body-parser';
import { invokeHttpHandler } from '../../http/invokeHttpHandler';
import { APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { Validation } from '../..';
import { IValidationRule, ValidatorFactory } from '../../validation';
import { LocalizedString } from '../../localization';
import { createTrigintaApp } from '../../Bootstrapping';

const { validate } = Validation;

const RECORDER_KEY = 'eventRecorder';

interface IEndpointRecorder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordRequest(request: any): void;
}

interface TagModel {
  key: string;
  displayText: string;
}

interface TestModel {
  firstName: string;
  count: number;
  tags?: TagModel[];
}

const Fugitive: LocalizedString = { key: 'Fugitive', defaultValue: 'Sounds too much like a fugitive, to me' };

class TestRule implements IValidationRule {
  async validate(context: Validation.ValidationContext): Promise<void> {
    if (context.value() === 'Fugi') {
      context.registerMessage(Fugitive);
    }
  }
}

const tagsSchema = Validation.parseRules<TagModel>({
  key: {
    required: true,
  },
  displayText: {
    required: true,
  },
});

const rules = Validation.parseRules<TestModel>({
  firstName: {
    required: true,
    custom: [new TestRule()],
  },
  count: {
    required: true,
  },
  tags: {
    array: tagsSchema,
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

    test('registers message for missing required fields in the array', async () => {
      const services = new ServiceCollection();
      services.factory<Validation.Validator>(
        Validation.ValidationServices.Validator,
        (ctx) => {
          return new Validation.Validator(ctx, rules);
        },
        Scopes.Singleton,
      );
      services.factory<Validation.ValidatorFactory>(
        Validation.ValidationServices.ValidatorFactory,
        (ctx) => {
          return new ValidatorFactory(ctx);
        },
        Scopes.Singleton,
      );

      const container = services.buildContainer();
      const validator = container.get<Validation.Validator>(Validation.ValidationServices.Validator);
      const payload = {
        firstName: 'test',
        count: 1,
        tags: [{} as TagModel, { displayText: 'test' } as TagModel],
      } as TestModel;
      const notification = await validator.validate(payload);

      const messages = notification.allMessages();
      expect(messages.length).toBe(3);
      expect(messages[0].field).toBe('tags[0].key');
      expect(messages[0].localizedString).toBe(Validation.ValidationKeys.Required);

      expect(messages[1].field).toBe('tags[0].displayText');
      expect(messages[1].localizedString).toBe(Validation.ValidationKeys.Required);

      expect(messages[2].field).toBe('tags[1].key');
      expect(messages[2].localizedString).toBe(Validation.ValidationKeys.Required);
    }, 1000000);
  });

  describe('http integration', () => {
    test('registers message for missing required field', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];

      const { containers } = createTrigintaApp({
        http: {
          modules: [
            createServiceModule('test', (services) => {
              services.singleton<IEndpointRecorder>(RECORDER_KEY, {
                recordRequest(request) {
                  messages.push(request);
                },
              });
            }),
          ],
        },
      });

      const { http: container } = containers;
      const body: TestModel = {
        firstName: '',
        count: 0,
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

      const responseBody = JSON.parse(response.body ?? '') as Validation.IValidationResponse;
      expect(responseBody.errors.length).toBe(1);
      expect(responseBody.errors[0].field).toBe('firstName');
      expect(responseBody.errors[0].message).toBe(Validation.ValidationKeys.Required.defaultValue);
    });

    test('registers message for custom rule', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];
      const { containers } = createTrigintaApp({
        http: {
          modules: [
            createServiceModule('test', (services) => {
              services.register<IEndpointRecorder>(RECORDER_KEY, {
                recordRequest(request) {
                  messages.push(request);
                },
              });
            }),
          ],
        },
      });

      const { http: container } = containers;
      const body: TestModel = {
        firstName: 'Fugi',
        count: 0,
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

      const responseBody = JSON.parse(response.body ?? '') as Validation.IValidationResponse;
      expect(responseBody.errors.length).toBe(1);
      expect(responseBody.errors[0].field).toBe('firstName');
      expect(responseBody.errors[0].message).toBe(Fugitive.defaultValue);
    });

    test('passes control to endpoint if validation succeeds', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];

      const { containers } = createTrigintaApp({
        http: {
          modules: [
            createServiceModule('test', (services) => {
              services.register<IEndpointRecorder>(RECORDER_KEY, {
                recordRequest(request) {
                  messages.push(request);
                },
              });
            }),
          ],
        },
      });

      const { http: container } = containers;
      const body: TestModel = {
        firstName: 'I AM VALID OKAY',
        count: 0,
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

      expect(messages.length).toBe(1);
      expect(response.statusCode).toEqual(204);
    });
  });
});

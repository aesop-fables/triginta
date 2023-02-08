import 'reflect-metadata';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { getRoute, HttpLambda, IConfiguredRoute, IHttpEndpoint, useMiddleware } from '..';
import { createServiceModule, inject } from '@aesop-fables/containr';
import { parsePathParameters, createApiGatewayEvent, invokeHttpHandler } from '../invokeHttpHandler';
import jsonBodyParser from '@middy/http-json-body-parser';

const RECORDER_KEY = 'eventRecorder';

interface IEndpointRecorder {
  recordEvent(event: APIGatewayProxyEventV2): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recordRequest(request: any): void;
}

interface ParsingRequest {
  foo: string;
  bar: string;
}

@useMiddleware(jsonBodyParser)
class ParsingTestEndpoint implements IHttpEndpoint<ParsingRequest, void> {
  constructor(@inject(RECORDER_KEY) private readonly events: IEndpointRecorder) {}
  async handle(message: ParsingRequest, event: APIGatewayProxyEventV2): Promise<void> {
    console.log(message);
    this.events.recordEvent(event);
    this.events.recordRequest(message);
  }
}

describe('createApiGatewayEvent', () => {
  describe('parsePathParameters', () => {
    describe('GET', () => {
      test('path with no params', async () => {
        const event = parsePathParameters({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'GET',
            route: '/test/hello',
          },
          path: '/test/hello',
        });

        expect(event.rawPath).toBe('/test/hello');
        expect(event.pathParameters).toStrictEqual({});
      });

      test('path with query string', async () => {
        const event = parsePathParameters({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'GET',
            route: '/test/hello',
          },
          path: '/test/hello?foo=bar&bar=foo',
        });

        expect(event.rawPath).toBe('/test/hello?foo=bar&bar=foo');
        expect(event.pathParameters).toStrictEqual({});
        expect(event.queryStringParameters).toEqual({
          bar: 'foo',
          foo: 'bar',
        });
      });

      test('path with route params', async () => {
        const event = parsePathParameters({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'GET',
            route: '/params/{param1}/blah/{param2}',
          },
          path: '/params/hello/blah/world',
        });

        expect(event.rawPath).toBe('/params/hello/blah/world');
        expect(event.pathParameters).toEqual({
          param1: 'hello',
          param2: 'world',
        });
      });
    });
  });

  describe('verify event', () => {
    describe('root', () => {
      test('verify common properties', () => {
        const event = createApiGatewayEvent({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'GET',
            route: '/test',
          },
          path: '/test',
        });

        expect(event.version).toBe('2.0');
        expect(event.routeKey).toBe('GET /test');
      });
    });

    describe('requestContext', () => {
      test('verify common properties', () => {
        const event = createApiGatewayEvent({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'GET',
            route: '/test',
          },
          path: '/test',
        });

        expect(event.requestContext?.accountId).toBe('888888888888');
        expect(event.requestContext?.apiId).toBe('trigintaLocal');
        expect(event.requestContext?.stage).toBe('$default');
        expect(event.requestContext?.timeEpoch).toBeDefined();
        expect(event.requestContext?.time).toBeDefined();
        expect(event.requestContext?.requestId).toBeDefined();

        expect(event.requestContext?.routeKey).toBe('GET /test');
      });

      describe('http', () => {
        test('verify common properties', () => {
          const event = createApiGatewayEvent({
            configuredRoute: {
              constructor: ParsingTestEndpoint,
              method: 'GET',
              route: '/test',
            },
            path: '/test',
          });

          expect(event.requestContext?.http?.method).toBe('GET');
          expect(event.requestContext?.http?.path).toBe('/test');
          expect(event.requestContext?.http?.protocol).toBe('HTTP/1.1');
          expect(event.requestContext?.http?.sourceIp).toBe('127.0.0.1');
          expect(event.requestContext?.http?.userAgent).toBe('triginta/1.0');
        });
      });
    });

    describe('headers', () => {
      test('verify common properties', () => {
        const event = createApiGatewayEvent({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'GET',
            route: '/test',
          },
          path: '/test',
        });

        const headers = event.headers ?? {};
        expect(event.headers?.accept).toBe('*/*');
        expect(headers['x-amzn-trace-id']).toBeDefined();
        expect(headers['x-forwarded-for']).toBeDefined();
        expect(headers['x-forwarded-port']).toBeDefined();
        expect(headers['x-forwarded-proto']).toBeDefined();
      });
    });
  });

  test('Generates the body', async () => {
    const body = {
      foo: 'bar',
      bar: 'foo',
    };

    const event = createApiGatewayEvent({
      configuredRoute: {
        constructor: ParsingTestEndpoint,
        method: 'POST',
        route: '/test',
      },
      path: '/test',
      body,
    });

    expect(event.body).toEqual(`{\"foo\":\"bar\",\"bar\":\"foo\"}`);
  });
});

describe('invokeHttpHandler', () => {
  describe('middyified handlers', () => {
    it('test the json parsing middleware', async () => {
      const events: APIGatewayProxyEventV2[] = [];
      const messages: any[] = [];

      HttpLambda.initialize([
        createServiceModule('test', (services) => {
          services.register<IEndpointRecorder>(RECORDER_KEY, {
            recordEvent(event) {
              events.push(event);
            },
            recordRequest(request) {
              messages.push(request);
            },
          });
        }),
      ]);

      const container = HttpLambda.getContainer();
      const body: ParsingRequest = {
        foo: 'bar',
        bar: 'foo',
      };

      const response = (await invokeHttpHandler<APIGatewayProxyResultV2>({
        configuredRoute: {
          constructor: ParsingTestEndpoint,
          method: 'POST',
          route: '/triginta/middlware/json',
        },
        container,
        path: '/triginta/middlware/json',
        body,
      })) as APIGatewayProxyStructuredResultV2;

      expect(messages[0]).toEqual(body);

      console.log(response);
      expect(response.statusCode).toEqual(200);
    });
  });
});

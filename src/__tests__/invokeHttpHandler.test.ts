import 'reflect-metadata';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { createTrigintaApp, httpPost, IHttpEndpoint, TestUtils, useMiddleware } from '..';
import { createServiceModule, inject } from '@aesop-fables/containr';
import jsonBodyParser from '@middy/http-json-body-parser';

const { parsePathParameters, createApiGatewayEvent, invokeHttpHandler } = TestUtils;

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

@httpPost('/triginta/middlware/json')
@useMiddleware(jsonBodyParser)
class ParsingTestEndpoint implements IHttpEndpoint<ParsingRequest, void> {
  constructor(@inject(RECORDER_KEY) private readonly events: IEndpointRecorder) {}
  async handle(message: ParsingRequest, event: APIGatewayProxyEventV2): Promise<void> {
    this.events.recordEvent(event);
    this.events.recordRequest(message);
  }
}

describe('createApiGatewayEvent', () => {
  describe('parsePathParameters', () => {
    describe('get', () => {
      test('path with no params', async () => {
        const event = parsePathParameters({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'get',
            route: '/test/hello',
          },
          rawPath: '/test/hello',
        });

        expect(event.rawPath).toBe('/test/hello');
        expect(event.pathParameters).toStrictEqual({});
      });

      test('path with query string', async () => {
        const event = parsePathParameters({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'get',
            route: '/test/hello',
          },
          rawPath: '/test/hello?foo=bar&bar=foo',
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
            method: 'get',
            route: '/params/{param1}/blah/{param2}',
          },
          rawPath: '/params/hello/blah/world',
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
            method: 'get',
            route: '/test',
          },
          rawPath: '/test',
        });

        expect(event.version).toBe('2.0');
        expect(event.routeKey).toBe('get /test');
      });
    });

    describe('requestContext', () => {
      test('verify common properties', () => {
        const event = createApiGatewayEvent({
          configuredRoute: {
            constructor: ParsingTestEndpoint,
            method: 'get',
            route: '/test',
          },
          rawPath: '/test',
        });

        expect(event.requestContext?.accountId).toBe('888888888888');
        expect(event.requestContext?.apiId).toBe('trigintaLocal');
        expect(event.requestContext?.stage).toBe('$default');
        expect(event.requestContext?.timeEpoch).toBeDefined();
        expect(event.requestContext?.time).toBeDefined();
        expect(event.requestContext?.requestId).toBeDefined();

        expect(event.requestContext?.routeKey).toBe('get /test');
      });

      describe('http', () => {
        test('verify common properties', () => {
          const event = createApiGatewayEvent({
            configuredRoute: {
              constructor: ParsingTestEndpoint,
              method: 'get',
              route: '/test',
            },
            rawPath: '/test',
          });

          expect(event.requestContext?.http?.method).toBe('get');
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
            method: 'get',
            route: '/test',
          },
          rawPath: '/test',
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
        method: 'post',
        route: '/test',
      },
      rawPath: '/test',
      body,
    });

    expect(event.body).toEqual(`{\"foo\":\"bar\",\"bar\":\"foo\"}`);
  });
});

describe('invokeHttpHandler', () => {
  describe('middyified handlers', () => {
    it('test the json parsing middleware', async () => {
      const events: APIGatewayProxyEventV2[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = [];
      const { containers } = createTrigintaApp({
        http: {
          modules: [
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
          ],
        },
      });

      const { http: container } = containers;

      const body: ParsingRequest = {
        foo: 'bar',
        bar: 'foo',
      };

      const response = (await invokeHttpHandler<APIGatewayProxyResultV2>({
        configuredRoute: {
          constructor: ParsingTestEndpoint,
          method: 'post',
          route: '/triginta/middlware/json',
        },
        container,
        rawPath: '/triginta/middlware/json?foo=bar',
        body,
      })) as APIGatewayProxyStructuredResultV2;

      expect(messages[0]).toEqual(body);
      expect(response.statusCode).toEqual(204);

      const [event] = events;
      expect(event?.queryStringParameters?.foo).toEqual('bar');
    });
  });
});

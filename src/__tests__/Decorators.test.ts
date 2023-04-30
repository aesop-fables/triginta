/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import {
  getRoute,
  endpointMetadataKey,
  httpGet,
  middlewareMetadataKey,
  getMiddleware,
  useMiddleware,
  httpPost,
  httpPut,
  httpDelete,
} from '../Decorators';
import { IConfiguredRoute } from '../http/IConfiguredRoute';

describe('Decorators', () => {
  describe('routing', () => {
    test('getRoute', () => {
      const target = () => {
        return null;
      };
      const route = 'testRoute';
      const method = 'get';
      const params: IConfiguredRoute = { method, route, constructor: target as Function };
      Reflect.defineMetadata(endpointMetadataKey, params, target);
      expect(getRoute(target as Function)).toBe(Reflect.getMetadata(endpointMetadataKey, target));
    });

    // For the following, we really just want to make sure that
    // the proper verb/method is getting registered (easy to screw up w/ a bad copy/paste when we're writing stuff fast)
    describe('routing helpers register the correct path/verb', () => {
      test('httpGet', () => {
        const route = 'testGet';

        @httpGet(route)
        class HttpGetTestEndpoint {}

        const actual = getRoute(HttpGetTestEndpoint);
        expect(actual?.route).toBe(route);
        expect(actual?.method).toBe('get');
      });

      test('httpPost', () => {
        const route = 'testPost';

        @httpPost(route)
        class HttpPostTestEndpoint {}

        const actual = getRoute(HttpPostTestEndpoint);
        expect(actual?.route).toBe(route);
        expect(actual?.method).toBe('post');
      });

      test('httpPut', () => {
        const route = 'testPut';

        @httpPut(route)
        class HttpPutTestEndpoint {}

        const actual = getRoute(HttpPutTestEndpoint);
        expect(actual?.route).toBe(route);
        expect(actual?.method).toBe('put');
      });

      test('httpDelete', () => {
        const route = 'testDelete';

        @httpDelete(route)
        class HttpDeleteTestEndpoint {}

        const actual = getRoute(HttpDeleteTestEndpoint);
        expect(actual?.route).toBe(route);
        expect(actual?.method).toBe('delete');
      });
    });
  });

  describe('middlware', () => {
    test('getMiddleware', () => {
      const target = { targetname: 'target' };

      Reflect.defineMetadata(middlewareMetadataKey, target, target);

      expect(getMiddleware(target)).toBe(target);
    });

    describe('useMiddleware', () => {
      test('registers a single middleware', () => {
        function testMiddy() {
          return null;
        }

        @useMiddleware(testMiddy)
        class TestingUseMiddlewareDecorator {}

        const actual = getMiddleware(TestingUseMiddlewareDecorator) as any[];

        expect(actual).toStrictEqual([testMiddy]);
      });

      test('registers multiple middleware in a single call', () => {
        function testMiddy1() {
          return null;
        }
        function testMiddy2() {
          return null;
        }

        @useMiddleware(testMiddy1, testMiddy2)
        class TestingUseMiddlewareDecorator {}

        const actual = getMiddleware(TestingUseMiddlewareDecorator) as any[];

        expect(actual).toStrictEqual([testMiddy1, testMiddy2]);
      });

      // Slack convo about this one: https://dovetailsoftware.slack.com/archives/C04FG3C8S73/p1674666471767919
      test('registers multiple middleware in multiple calls', () => {
        function testMiddy1() {
          return null;
        }
        function testMiddy2() {
          return null;
        }
        function testMiddy3() {
          return null;
        }
        function testMiddy4() {
          return null;
        }

        @useMiddleware(testMiddy1, testMiddy2)
        @useMiddleware(testMiddy3, testMiddy4)
        class TestingUseMiddlewareDecorator {}

        const actual = getMiddleware(TestingUseMiddlewareDecorator) as any[];

        expect(actual).toStrictEqual([testMiddy3, testMiddy4, testMiddy1, testMiddy2]);
      });
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { createServiceModuleWithOptions } from '@aesop-fables/containr';
import { HttpLambdaServices, IHttpResponseGenerator, IConfiguredRoute, createTrigintaApp } from '..';

const testModule = createServiceModuleWithOptions<IConfiguredRoute>('testModule', (services, route) =>
  services.register<IConfiguredRoute>(HttpLambdaServices.CurrentRoute, route),
);

async function verifyDefaultResponse(route: IConfiguredRoute, expected: number) {
  const { containers } = createTrigintaApp({ http: { modules: [] } });
  const container = containers.http.createChildContainer('HttpResponseGeneratorTester', [testModule(route)]);
  const generator = container.get<IHttpResponseGenerator>(HttpLambdaServices.HttpResponseGenerator);

  const generatorResponse = await generator.generateResponse(route.constructor());
  expect(generatorResponse.statusCode).toEqual(expected);
}

describe('HttpResponseGenerator', () => {
  test('Defaults', async () => {
    const response = {};
    await verifyDefaultResponse({ method: 'get', constructor: () => response, route: 'test' }, 200);
    await verifyDefaultResponse({ method: 'options', constructor: () => response, route: 'test' }, 200);

    await verifyDefaultResponse({ method: 'delete', constructor: () => response, route: 'test' }, 200);
    await verifyDefaultResponse({ method: 'delete', constructor: () => undefined, route: 'test' }, 204);

    await verifyDefaultResponse({ method: 'post', constructor: () => response, route: 'test' }, 200);
    await verifyDefaultResponse({ method: 'post', constructor: () => undefined, route: 'test' }, 204);

    await verifyDefaultResponse({ method: 'put', constructor: () => response, route: 'test' }, 200);
    await verifyDefaultResponse({ method: 'put', constructor: () => undefined, route: 'test' }, 204);
  });
});

export * from './IHandler';
export * from './http/IHttpEndpoint';
export * from './Decorators';
export * from './http/HttpLambda';
export * from './http/HttpLambdaServices';
export { default as RouteRegistry, IRouteRegistry } from './RouteRegistry';
export * from './SqsLambda';
export * from './SqsLambdaServices';
export * from './ISqsMessageHandler';
export * from './http/IConfiguredRoute';
export * from './TrigintaConfig';

import * as httpUtils from './http/invokeHttpHandler';
import * as sqsUtils from './invokeSqsHandler';

/**
 * Provides helper functions for invoking lambdas in unit/integration tests.
 */
export const TestUtils = {
  ...httpUtils,
  ...sqsUtils,
};

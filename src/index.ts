export * from './IHandler';
export * from './IHttpEndpoint';
export * from './Decorators';
export * from './HttpLambda';
export * from './HttpLambdaServices';
export { default as RouteRegistry, IRouteRegistry } from './RouteRegistry';
export * from './SqsLambda';
export * from './SqsLambdaServices';
export * from './ISqsMessageHandler';
export * from './IConfiguredRoute';
export * from './TrigintaConfig';

import * as httpUtils from './invokeHttpHandler';
import * as sqsUtils from './invokeSqsHandler';

/**
 * Provides helper functions for invoking lambdas in unit/integration tests.
 */
export const TestUtils = {
  ...httpUtils,
  ...sqsUtils,
};

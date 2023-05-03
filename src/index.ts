export * from './IHandler';
export * from './http/IHttpEndpoint';
export * from './Decorators';
export * from './http/HttpLambda';
export * from './http/HttpLambdaServices';
export { default as RouteRegistry, IRouteRegistry } from './RouteRegistry';
export * from './sqs/SqsLambda';
export * from './sqs/SqsLambdaServices';
export * from './sqs/ISqsMessageHandler';
export * from './sqs/RecordMatchers';
export * from './sqs/ISqsMessage';
export * from './http/IConfiguredRoute';
export * from './TrigintaConfig';

export * as Localization from './localization';
export * as Validation from './validation';

import * as httpUtils from './http/invokeHttpHandler';
import * as sqsUtils from './sqs/invokeSqsHandler';

/**
 * Provides helper functions for invoking lambdas in unit/integration tests.
 */
export const TestUtils = {
  ...httpUtils,
  ...sqsUtils,
};

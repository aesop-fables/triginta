export { default as RouteRegistry, IRouteRegistry } from './RouteRegistry';
export * from './AwsServices';
export * from './Bootstrapping';
export * from './Decorators';
export * from './IHandler';
export * from './ITrigintaRuntime';
export * from './ITrigintaRuntimeFactory';
export * from './http/IConfiguredRoute';
export * from './http/IHttpEndpoint';
export * from './http/HttpLambda';
export * from './http/HttpLambdaServices';
export * from './kinesis';
export * from './resolveEnvironmentSettings';
export * from './s3/IS3RecordHandler';
export * from './s3/S3Lambda';
export * from './s3/S3LambdaServices';
export * from './sqs/SqsLambda';
export * from './sqs/SqsLambdaServices';
export * from './sqs/ISqsMessageHandler';
export * from './sqs/ISqsFailureHandler';
export * from './sqs/RecordMatchers';
export * from './sqs/ISqsMessage';
export * from './sqs/MessagePublisher';
export * from './sqs/SqsSettings';
export * from './sqs/IQueue';
export * from './sqs/SqsPublisher';
export * from './TrigintaConfig';
export * from './TrigintaHeaders';
export * from './TrigintaMiddleware';
export * from './TrigintaServices';

export * as Localization from './localization';
export * as Validation from './validation';
export * as Logging from './logging';

import * as httpUtils from './http/invokeHttpHandler';
import * as kinesisUtils from './kinesis/invokeKinesisHandler';
import * as sqsUtils from './sqs/invokeSqsHandler';
import * as s3Utils from './s3/invokeS3Handler';

/**
 * Provides helper functions for invoking lambdas in unit/integration tests.
 */
export const TestUtils = {
  ...httpUtils,
  ...kinesisUtils,
  ...sqsUtils,
  ...s3Utils,
};

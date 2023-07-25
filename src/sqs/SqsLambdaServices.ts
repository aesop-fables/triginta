import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('sqs');

export const SqsLambdaServices = {
  CurrentRecord: namedService('SqsCurrentRecord'),
  DefaultRecordMatcher: namedService('DefaultRecordMatcher'),
  FailureHandler: namedService('FailureHandler'),
  MessageDeserializer: namedService('MessageDeserializer'),
  MessagePublisher: namedService('MessagePublisher'),
  RecordMatchers: namedService('RecordMatchers'),
  SqsLambdaFactory: namedService('SqsLambdaFactory'),
  SqsPublisher: namedService('SqsPublisher'),
  SqsSettings: namedService('SqsSettings'),
};

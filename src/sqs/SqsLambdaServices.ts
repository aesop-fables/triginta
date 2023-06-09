import { createServiceNamespacer } from '../Utils';

const namedService = createServiceNamespacer('sqs');

export const SqsLambdaServices = {
  SqsLambdaFactory: namedService('SqsLambdaFactory'),
  DefaultRecordMatcher: namedService('DefaultRecordMatcher'),
  MessageDeserializer: namedService('MessageDeserializer'),
  RecordMatchers: namedService('RecordMatchers'),
  MessagePublisher: namedService('MessagePublisher'),
  SqsPublisher: namedService('SqsPublisher'),
  SqsSettings: namedService('SqsSettings'),
  CurrentEvent: namedService('SqsCurrentEvent'),
  CurrentRecord: namedService('SqsCurrentRecord'),
};

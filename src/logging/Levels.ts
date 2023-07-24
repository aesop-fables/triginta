import { inject } from '@aesop-fables/containr';
import { APIGatewayProxyEventV2, SQSRecord } from 'aws-lambda';
import { SqsLambdaServices } from '../sqs/SqsLambdaServices';
import { TrigintaHeaders } from '../TrigintaHeaders';
import { AwsServices } from '../AwsServices';

export interface LoggingLevel {
  resolveLevel(): string | undefined;
}

export class CurrentRequestLoggingLevel implements LoggingLevel {
  constructor(@inject(AwsServices.Event) private readonly event: APIGatewayProxyEventV2) {}

  resolveLevel(): string | undefined {
    return this.event.headers[TrigintaHeaders.LogLevel.toLowerCase()];
  }
}

export class CurrentRecordLoggingLevel implements LoggingLevel {
  constructor(@inject(SqsLambdaServices.CurrentRecord) private readonly record: SQSRecord) {}

  resolveLevel(): string | undefined {
    return this.record.messageAttributes[TrigintaHeaders.LogLevel]?.stringValue;
  }
}

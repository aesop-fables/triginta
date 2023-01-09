import { Callback, Context, KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';
import { IHandler } from './IHandler';
import { LambdaFactory } from './LambdaFactory';

declare type HandlerResolver<Message, Event> = IHandler<Message, Event> | (() => IHandler<Message, Event>);

export interface ScenarioResult<Message, Event> {
  messages: Message[];
  event: Event;
  handler: IHandler<Message, Event>;
}

export interface ScenarioOptions<Message> {
  messages: Message[];
}

export interface KinesisScenarioOptions<Message> extends ScenarioOptions<Message> {
  kinesis?: {
    awsRegion?: string;
    eventSource?: string;
    eventName?: string;
    eventSourceARN?: string;
    eventVersion?: string;
    invokeIdentityArn?: string;
  };
}

const DefaultKinesisScenarioOptions = {
  eventSource: 'aws:kinesis',
  eventVersion: '1.0',
  eventName: 'aws:kinesis:record',
  invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-kinesis-role',
  awsRegion: 'us-west-2',
  eventSourceARN: 'arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream',
};

const context: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: '',
  functionVersion: '',
  invokedFunctionArn: '',
  memoryLimitInMB: '',
  awsRequestId: '',
  logGroupName: '',
  logStreamName: '',
  getRemainingTimeInMillis: function (): number {
    throw new Error('Function not implemented.');
  },
  done: function (error?: Error | undefined, result?: any): void {
    throw new Error('Function not implemented.');
  },
  fail: function (error: string | Error): void {
    throw new Error('Function not implemented.');
  },
  succeed: function (messageOrObject: any): void {
    throw new Error('Function not implemented.');
  },
};

const callback: Callback<any> = () => {
  // no-op
};

let seed = 49590338271490;

export async function runKinesisScenario<Message>(
  resolver: HandlerResolver<Message, KinesisStreamEvent>,
  options: KinesisScenarioOptions<Message> = { messages: [] },
): Promise<ScenarioResult<Message, KinesisStreamEvent>> {
  const factoryOptions = {
    kinesis: {
      ...DefaultKinesisScenarioOptions,
      ...options.kinesis,
    },
    ...options,
  };

  const handler = typeof resolver === 'function' ? resolver() : (resolver as IHandler<Message, KinesisStreamEvent>);
  const event: KinesisStreamEvent = {
    Records: options.messages.map((msg) => {
      return {
        ...factoryOptions.kinesis,
        eventID: '',
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: '1',
          sequenceNumber: `${++seed}`,
          data: Buffer.from(JSON.stringify(msg), 'ascii').toString('base64'),
          approximateArrivalTimestamp: new Date().getTime(),
          eventID: `shardId-000000000000:${seed}`,
        },
      } as KinesisStreamRecord;
    }),
  };

  const factory = new LambdaFactory();
  const kinesisHandler = factory.createKinesisLambda({
    factory() {
      return handler;
    },
  });

  await kinesisHandler(event, context, callback);

  return {
    event,
    messages: options.messages,
    handler,
  };
}

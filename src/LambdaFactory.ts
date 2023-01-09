import { KinesisStreamEvent, Handler, S3Event, S3EventRecord, SQSEvent } from 'aws-lambda';
import { ILambdaFactory, KinesisLambdaOptions, S3LambdaOptions, SqsLambdaOptions } from './ILambdaFactory';

const isValidJson = (data: string) => {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export class LambdaFactory implements ILambdaFactory {
  createKinesisLambda<Message>(options: KinesisLambdaOptions<Message>): Handler<KinesisStreamEvent> {
    try {
      const messageHandler = options.factory();
      return async (event: KinesisStreamEvent) => {
        const { Records } = event;
        console.log('Processing Kinesis records', Records.length);

        for (let i = 0; i < Records.length; i++) {
          const record = Records[i];
          let data = record.kinesis.data;

          while (!isValidJson(data)) {
            data = Buffer.from(data, 'base64').toString('utf8');
          }

          const request = JSON.parse(data) as Message;
          await messageHandler.handle(request, event);
        }
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  createS3Lambda(options: S3LambdaOptions<S3EventRecord>): Handler<S3Event> {
    try {
      const messageHandler = options.factory();
      return async (event: S3Event) => {
        const { Records } = event;
        console.log('Processing S3 records', Records.length);

        for (let i = 0; i < Records.length; i++) {
          const record = Records[i];
          console.log(`Processing record ${record.s3?.bucket}/${record.s3?.object?.key}`);
          await messageHandler.handle(record, event);
        }
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  createSqsLambda<Message>(options: SqsLambdaOptions<Message>): Handler<SQSEvent> {
    try {
      const messageHandler = options.factory();
      return async (event: SQSEvent) => {
        const { Records } = event;
        console.log('Processing SQS records', Records.length);

        for (let i = 0; i < Records.length; i++) {
          const record = Records[i];
          console.log(`Processing record ${record.messageId}`);

          const request = JSON.parse(record.body) as Message;
          await messageHandler.handle(request, event);
        }
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

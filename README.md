# @aesop-fables/triginta

`triginta` is a lightweight framework that wraps the basic infrastructure usages of AWS Lambda (SQS, Kinesis, etc.). For APIs, see our `API framework`. It aims
to conventionalize logging, error handling, and X-Ray integration.

## Installation
```
npm install @aesop-fables/triginta
```
```
yarn add @aesop-fables/triginta
```

## Supported Lambdas
The following can be created via the `ILambdaFactory` interface:

1. SQS Lambdas (`createSqsLambda`)
2. S3 Lambdas (`createS3Lambda`)
3. Kinesis Lambdas (`createKinesisLambda`)

## Known issues
We're missing unit tests, logging, error handling, middleware support, and X-Ray integration. This will all come soon - I just wanted to get the basic structure published.

## Example
```typescript
// index.ts
interface MyQueuedMessage {
  message: string;
}

class MyLambda implements IHandler<MyQueuedMessage> {
  async handle(message: MyQueuedMessage): Promise<void> {
    console.log('HELLO, WORLD!');
    console.log(JSON.stringify(message, null, 2));
  }
}

// obviously you need to register all of your stuff
const container = bootstrap();
// triginta doesn't depend on containr but it abstracts out the creation of your handler
// so that you can easily plug it in (see the `factory` property)
const lambdaFactory = container.get<ILambdaFactory>();

export const handler = lambdaFactory.createSqsLambda<MyLambda>({
  factory: () => container.get<MyLambda>('lambda'),
});
```

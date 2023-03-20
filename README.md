# @aesop-fables/triginta

`triginta` is a lightweight framework that wraps the basic infrastructure usages of AWS Lambda (SQS, Kinesis, etc.) and is entirely based on top of Middyjs. 

## Installation
```
npm install @aesop-fables/triginta
```
```
yarn add @aesop-fables/triginta
```

## Docs

Docs are coming. In the meantime, we recommend you checkout the docs from middyjs and our example repo: 
https://github.com/aesop-fables/triginta-example


## Breaking Changes

### v0.4.0

The `path` property of the `InvocationContext` (used in `invokeHttpHandler`) was renamed to `rawPath` to properly match the 
expected API Gateway Event.

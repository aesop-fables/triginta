import { createContainer } from '@aesop-fables/containr';
import { getRoute } from '..';
import { createHttpLambda } from '../HttpLambda';
import { invokeHttpHandler } from '../invokeHttpHandler';
import {
  CreateStatusAlertRequest,
  setupCreateHttpLambdaTest,
  CreateStatusAlertEndpoint,
  Recorder,
  TestServices,
} from './common';

// Step 2: We'll create the test blocks and list out the tests we SHOULD have

// Step 3: We'll actually implement the tests

function blah() {
  await invokeHttpEndpoint({
    endpoint: CreateStatusAlertEndpoint,
    payload: {
      app: 'Agent',
      version: '1.0',
      region: 'us-west',
      message: 'Stop the presses!',
      active: true,
    },
  });
}

describe('createHttpLambda', () => {
  describe('get', () => {
    test('using single middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware with multiple calls', () => {
      throw new Error('Not Yet Implemented');
    });
  });
  describe('put', () => {
    test('using single middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware with multiple calls', () => {
      throw new Error('Not Yet Implemented');
    });
  });
  describe('post', () => {
    test('using single middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware with multiple calls', () => {
      throw new Error('Not Yet Implemented');
    });
  });
  describe('delete', () => {
    test('using single middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware', () => {
      throw new Error('Not Yet Implemented');
    });
    test('using multiple middleware with multiple calls', () => {
      throw new Error('Not Yet Implemented');
    });
  });
});

//   test('Test the IHttpEndpoint handler', async () => {
//     const body: CreateStatusAlertRequest = {
//       app: 'Agent',
//       version: '1.0',
//       region: 'us-west',
//       message: 'Stop the presses!',
//       active: true,
//     };

//     const container = createContainer([setupCreateHttpLambdaTest]);
//     const handler = createHttpLambda(CreateStatusAlertEndpoint, container);

//     const response = await invokeHttpHandler(handler, { body });

//     const recordedRequest = container.get<Recorder>(TestServices.Recorder).request;

//     const endpointMetadata = getRoute(CreateStatusAlertEndpoint);

//     expect(endpointMetadata?.route).toEqual('testpath');

//     expect(response).toEqual({
//       id: '123',
//       ...recordedRequest,
//     });
//   });
// });

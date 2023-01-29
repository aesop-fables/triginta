describe('Decorators', () => {
  describe('routing', () => {
    test('getRoute', () => {
      // First, let's isolate this and make sure that it's functioning the way we expect
      // If it's good, then we know the other tests SHOULD pass
      throw new Error('Not implemented');
    });

    // For the following, we really just want to make sure that
    // the proper verb/method is getting registered (easy to screw up w/ a bad copy/paste when we're writing stuff fast)
    describe('routing helpers register the correct path/verb', () => {
      test('httpGet', () => {
        throw new Error('Not implemented');
      });

      test('httpPost', () => {
        throw new Error('Not implemented');
      });

      test('httpPut', () => {
        throw new Error('Not implemented');
      });

      test('httpDelete', () => {
        throw new Error('Not implemented');
      });
    });
  });

  describe('middlware', () => {
    test('getMiddleware', () => {
      // First, let's isolate this and make sure that it's functioning the way we expect
      // If it's good, then we know the other tests SHOULD pass
      throw new Error('Not implemented');
    });

    describe('useMiddleware', () => {
      test('registers a single middleware', () => {
        throw new Error('Not implemented');
      });

      test('registers multiple middleware in a single call', () => {
        throw new Error('Not implemented');
      });

      // Slack convo about this one: https://dovetailsoftware.slack.com/archives/C04FG3C8S73/p1674666471767919
      test('registers multiple middleware in multiple calls', () => {
        throw new Error('Not implemented');
      });
    });
  });
});

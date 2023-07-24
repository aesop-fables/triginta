/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import middy from '@middy/core';
import { IValidatorFactory } from './IValidatorFactory';
import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { ValidationServices } from './ValidationServices';
import { IValidationFailureHandler } from './IValidationFailureHandler';
import { IRuntimeContext } from '../IRuntimeContext';

export function validate(
  rules: IConfiguredValidationRule[],
): () => middy.MiddlewareObj<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
  return () => {
    return {
      async before(request) {
        const container = (request.context as unknown as IRuntimeContext).container;
        const validator = container.get<IValidatorFactory>(ValidationServices.ValidatorFactory).create(rules);
        const failureHandler = container.get<IValidationFailureHandler>(ValidationServices.ValidationFailureHandler);
        const model = request.event.body as unknown as object;

        const notification = await validator.validate(model);
        if (notification.isValid()) {
          return;
        }

        const response = await failureHandler.fail(notification);
        request.response = response;
      },
    };
  };
}

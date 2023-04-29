/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import middy from '@middy/core';
import { IRequestContext } from '../http/IRequestContext';
import { IValidatorFactory } from './IValidatorFactory';
import { IConfiguredValidationRule } from './IConfiguredValidationRule';
import { ValidationServices } from './ValidationServices';

export interface IValidationError {
  field: string;
  message: string;
}

export interface IValidationResponse {
  errors: IValidationError[];
}

export function validate(
  rules: IConfiguredValidationRule[],
): () => middy.MiddlewareObj<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2> {
  return () => {
    return {
      async before(request) {
        const container = (request.context as unknown as IRequestContext).container;
        const validator = container.get<IValidatorFactory>(ValidationServices.ValidatorFactory).create(rules);
        const model = request.event.body as unknown as object;

        const notification = await validator.validate(model);
        if (notification.isValid()) {
          return;
        }

        // TODO -- This should be a strategy
        request.response = {
          statusCode: 400,
          body: JSON.stringify({
            errors: notification.allMessages().map((msg) => {
              return {
                field: msg.field,
                message: msg.localizedString.defaultValue,
              } as IValidationError;
            }),
          } as IValidationResponse),
        };
      },
    };
  };
}

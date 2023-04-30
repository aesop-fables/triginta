import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { ValidationNotification } from './ValidationNotification';

export interface IValidationError {
  field: string;
  message: string;
}

export interface IValidationResponse {
  errors: IValidationError[];
}

export interface IValidationFailureHandler {
  fail(notification: ValidationNotification): Promise<APIGatewayProxyStructuredResultV2>;
}

export class ValidatiionFailureHandler implements IValidationFailureHandler {
  async fail(notification: ValidationNotification): Promise<APIGatewayProxyStructuredResultV2> {
    return {
      statusCode: 400,
      body: JSON.stringify({
        errors: notification.allMessages().map((msg) => {
          return {
            field: msg.field,
            message: msg.localizedString.defaultValue,
          } as IValidationError;
        }),
      } as IValidationResponse),
    }
  }
}

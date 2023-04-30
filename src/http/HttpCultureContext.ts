import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ICultureContext } from '../localization/ICultureContext';

export class HttpCultureContext implements ICultureContext {
  constructor(private readonly event: APIGatewayProxyEventV2) {}

  detectCulture(): string {
    const defaultCulture = 'en-US';
    if (this.event.headers) {
      return this.event.headers['Accept-Language'] ?? defaultCulture;
    }

    return defaultCulture;
  }
}

// test.ts - extra line breaks to help readability in slack
import { createHttpLambda, IHttpEndpoint } from '@dovetailsoftware/lambduh-http';
import { bootstrap } from './Bootstrap';

const container = bootstrap();

@put('/test')
@useDefaultConventions() // more on this later
class CreateStatusAlertEndpoint implements IHttpEndpoint<CreateStatusAlertRequest, string> {
  constructor(@inject('MyService') private readonly service: IService) {}
 
  async handle(request: CreateStatusAlertRequest, event: APIGatewayProxyEventV2): Promise<string> {
    return 'hello world!';
  }
}

// Now we call createHttpLambda and it turns our class into something that AWS can handle
export const handler = createHttpLambda(CreateStatusAlertEndpoint, container);

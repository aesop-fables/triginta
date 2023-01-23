import { Handler, APIGatewayProxyEventV2 } from 'aws-lambda';
import { IServiceContainer, Newable } from "@aesop-fables/containr";
import { IHttpEndpoint } from './IHttpEndpoint';

export function createHttpLambda<Input, Output>(lambdaClass: Newable<IHttpEndpoint<Input, Output>>, container: IServiceContainer): Handler<APIGatewayProxyEventV2> {
    return async (event: APIGatewayProxyEventV2) => {

        const endpoint = container.resolve(lambdaClass); 
    
        // #2 You need to deserialize the body into the input model
        const { body } = event;


        // #3 You need to execute the endpoint
        const result: Output = await endpoint.execute(body as Input);
        
        return {
          statusCode: 200,
          body: JSON.stringify(result),
        };
    };
}
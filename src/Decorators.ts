/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, IConfiguredRoute } from './IConfiguredRoute';
import RouteRegistry from './RouteRegistry';

/* eslint-disable @typescript-eslint/ban-types */
export const endpointMetadataKey = Symbol('@endpointMetadataKey');

function defineEndpointMetadata(method: HttpMethod, route: string) {
  return (target: Object): void => {
    const params: IConfiguredRoute = { method, route, constructor: target as Function };
    Reflect.defineMetadata(endpointMetadataKey, params, target);
    RouteRegistry.register(params);
  };
}

export function getRoute(target: Function): IConfiguredRoute | undefined {
  return Reflect.getMetadata(endpointMetadataKey, target);
}

export function httpGet(route: string) {
  return defineEndpointMetadata('get', route);
}

export function httpPut(route: string) {
  return defineEndpointMetadata('put', route);
}

export function httpDelete(route: string) {
  return defineEndpointMetadata('delete', route);
}

export function httpPost(route: string) {
  return defineEndpointMetadata('post', route);
}

/**
 * This is exposed internally for testing.
 * There shouldn't be a need to export this publicly
 */
export const middlewareMetadataKey = Symbol('@middlewareMetadataKey');

export function useMiddleware(...args: any[]) {
  return (target: Object): void => {
    let params = Reflect.getMetadata(middlewareMetadataKey, target) || [];
    params = params.concat(args);

    Reflect.defineMetadata(middlewareMetadataKey, params, target);
  };
}

export function getMiddleware(target: any): any[] | undefined {
  return Reflect.getMetadata(middlewareMetadataKey, target);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
export const routes: { [key: string]: IConfiguredRoute } = {};

export interface IConfiguredRoute {
  constructor: Function;
  method: string;
  route: string;
}

export const endpointMetadataKey = Symbol('@endpointMetadataKey');

function defineEndpointMetadata(method: string, route: string) {
  return (target: Object): void => {
    const params: IConfiguredRoute = { method, route, constructor: target as Function };
    Reflect.defineMetadata(endpointMetadataKey, params, target);
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

/* eslint-disable @typescript-eslint/ban-types */
export const routes: { [key: string]: IConfiguredRoute } = {};

export interface IConfiguredRoute {
  constructor: Function;
  method: string;
  route: string;
}

const endpointMetadataKey = Symbol('@endpointMetadataKey');

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

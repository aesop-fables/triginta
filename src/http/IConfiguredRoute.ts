export declare type HttpMethod = 'get' | 'post' | 'delete' | 'put' | 'options';

export interface IConfiguredRoute {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
  method: HttpMethod;
  route: string;
}

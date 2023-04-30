import { IConfiguredRoute } from './http/IConfiguredRoute';

export interface IRouteRegistry {
  allRoutes(): IConfiguredRoute[];
  register(route: IConfiguredRoute): void;
}

class RouteRegistry implements IRouteRegistry {
  private readonly routes: IConfiguredRoute[] = [];

  allRoutes(): IConfiguredRoute[] {
    return this.routes;
  }

  register(route: IConfiguredRoute): void {
    this.routes.push(route);
  }
}

export default new RouteRegistry();

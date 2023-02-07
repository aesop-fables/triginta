import { IConfiguredRoute } from './IConfiguredRoute';

class RouteRegistry {
  private readonly routes: IConfiguredRoute[] = [];

  allRoutes(): IConfiguredRoute[] {
    return this.routes;
  }

  register(route: IConfiguredRoute): void {
    this.routes.push(route);
  }
}

export default new RouteRegistry();

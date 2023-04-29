import { createServiceModule } from '@aesop-fables/containr';
import { ICultureContext, LocalizationServices } from '../localization';
import { HttpCultureContext } from './HttpCultureContext';
import { IRequestContext } from './IRequestContext';
import { HttpLambdaServices } from './HttpLambdaServices';

export const useHttpServices = createServiceModule('useHttpServices', (services) => {
  services.use<ICultureContext>(LocalizationServices.CultureContext, HttpCultureContext);
  services.register<IRequestContext>(HttpLambdaServices.RequestContext, (container) => {
    return {
      container,
    };
  });
});

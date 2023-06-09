import { Scopes, createServiceModule } from '@aesop-fables/containr';
import { ICultureContext, LocalizationServices } from '../localization';
import { HttpCultureContext } from './HttpCultureContext';

export const useHttpServices = createServiceModule('useHttpServices', (services) => {
  services.autoResolve<ICultureContext>(LocalizationServices.CultureContext, HttpCultureContext, Scopes.Transient);
});

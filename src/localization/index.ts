import { createServiceModule } from '@aesop-fables/containr';
import { ILocalizationStorage } from './ILocalizationStorage';
import { LocalizationServices } from './LocalizationServices';
import { LocalizationStorage } from './LocalizationStorage';
import { StringLocalizer } from './StringLocalizer';
import { IStringLocalizer } from './IStringLocalizer';

export * from './ICultureContext';
export * from './ILocalizationStorage';
export * from './IStringLocalizer';
export * from './LocalizationServices';
export * from './LocalizationStorage';
export * from './LocalizedString';
export * from './StringLocalizer';

export const useLocalization = createServiceModule('useLocalization', (services) => {
  services.use<ILocalizationStorage>(LocalizationServices.LocalizationStorage, LocalizationStorage);
  services.use<IStringLocalizer>(LocalizationServices.StringLocalizer, StringLocalizer);
});

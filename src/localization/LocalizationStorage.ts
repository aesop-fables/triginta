import { ILocalizationStorage, ILocalizedStringStorage } from './ILocalizationStorage';

// TODO -- Build this out more
export class LocalizationStorage implements ILocalizationStorage {
  lookupCulture(): ILocalizedStringStorage {
    return {};
  }
}

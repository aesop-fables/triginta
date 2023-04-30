import { ICultureContext } from './ICultureContext';
import { ILocalizationStorage } from './ILocalizationStorage';
import { IStringLocalizer } from './IStringLocalizer';
import { LocalizedString } from './LocalizedString';

export class StringLocalizer implements IStringLocalizer {
  constructor(private readonly storage: ILocalizationStorage, private readonly cultureContext: ICultureContext) {}

  resolve(value: LocalizedString): string {
    const culture = this.cultureContext.detectCulture();
    const store = this.storage.lookupCulture(culture);
    return store[value.key] ?? value.defaultValue ?? value.key;
  }
}

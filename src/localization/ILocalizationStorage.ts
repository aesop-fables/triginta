export interface ILocalizationStorage {
  lookupCulture(cultureCode: string): ILocalizedStringStorage;
}

export interface ILocalizedStringStorage {
  [key: string]: string;
}

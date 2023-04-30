import { LocalizedString } from './LocalizedString';

export interface IStringLocalizer {
  resolve(value: LocalizedString): string;
}

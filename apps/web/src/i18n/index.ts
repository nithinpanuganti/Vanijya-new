import { Language, UnifiedTranslations } from './types';
import { en } from './en';
import { hi } from './hi';
import { te } from './te';

export * from './types';
export * from './crops';
export * from './provider';
export * from './hooks';

export const translations: Record<Language, UnifiedTranslations> = {
  en,
  hi,
  te,
};

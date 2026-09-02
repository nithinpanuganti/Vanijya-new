import { Language } from './types';

export interface CropLocalization {
  en: string;
  hi: string;
  te: string;
  icon: string;
}

export const CROP_LOCALIZATIONS: Record<string, CropLocalization> = {
  tomato: { en: 'Tomato', hi: 'टमाटर', te: 'టమాటా', icon: '🍅' },
  onion: { en: 'Onion', hi: 'प्याज', te: 'ఉల్లిపాయ', icon: '🧅' },
  potato: { en: 'Potato', hi: 'आलू', te: 'బంగాళాదుంప', icon: '🥔' },
  wheat: { en: 'Wheat', hi: 'गेहूं', te: 'గోధుమలు', icon: '🌾' },
  paddy: { en: 'Paddy (Rice)', hi: 'धान (चावल)', te: 'వరి (బియ్యం)', icon: '🍚' },
  maize: { en: 'Maize (Corn)', hi: 'मक्का', te: 'మొక్కజొన్న', icon: '🌽' },
  cotton: { en: 'Cotton', hi: 'कपास', te: 'పత్తి', icon: '☁️' },
  chilli: { en: 'Chilli', hi: 'मिर्च', te: 'మిరపకాయ', icon: '🌶️' },
  soybean: { en: 'Soybean', hi: 'सोयाबीन', te: 'సోయాబీన్', icon: '🌱' },
  mustard: { en: 'Mustard', hi: 'सरसों', te: 'ఆవాలు', icon: '🌻' },
  garlic: { en: 'Garlic', hi: 'लहसुन', te: 'వెల్లుల్లి', icon: '🧄' },
  ginger: { en: 'Ginger', hi: 'अदरक', te: 'అల్లం', icon: '🫚' },
  turmeric: { en: 'Turmeric', hi: 'हल्दी', te: 'పసుపు', icon: '💛' },
  groundnut: { en: 'Groundnut', hi: 'मूंगफली', te: 'వేరుశెనగ', icon: '🥜' },
  gram: { en: 'Gram (Chana)', hi: 'चना', te: 'శనగలు', icon: '🥣' },
  pulses: { en: 'Pulses (Dal)', hi: 'दालें', te: 'పప్పుధాన్యాలు', icon: '🍲' },
};

/**
 * Returns the localized crop name based on active language
 */
export function getLocalizedCropName(cropNameOrId: string | undefined | null, lang: Language): string {
  if (!cropNameOrId) return '';
  const key = cropNameOrId.toLowerCase().replace(/[^a-z]/g, '');
  for (const [cropKey, loc] of Object.entries(CROP_LOCALIZATIONS)) {
    if (key.includes(cropKey) || cropKey.includes(key)) {
      return loc[lang] || loc.en;
    }
  }
  return cropNameOrId;
}

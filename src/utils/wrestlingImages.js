import beginnerImg from '../assets/akhada/programs-beginner.png';
import strengthImg from '../assets/akhada/programs-strength-hd.png';
import mudImg from '../assets/akhada/programs-mud-hd.png';
import advancedImg from '../assets/akhada/programs-advanced.png';
import yogaImg from '../assets/akhada/programs-yoga.png';
import facilitiesMud from '../assets/akhada/facilities-mud.png';
import galleryAction from '../assets/akhada/gallery-action-1.png';

/** Local premium wrestling fallbacks when CMS/media URLs fail */
export const wrestlingFallbacks = {
  beginner: beginnerImg,
  strength: strengthImg,
  mud: mudImg,
  advanced: advancedImg,
  yoga: yogaImg,
  facilities: facilitiesMud,
  gallery: galleryAction,
  default: mudImg,
};

export function wrestlingFallbackForTitle(title = '') {
  const t = String(title).toLowerCase();
  if (t.includes('beginner') || t.includes('foundation')) return wrestlingFallbacks.beginner;
  if (t.includes('yoga') || t.includes('mobility')) return wrestlingFallbacks.yoga;
  if (t.includes('strength') || t.includes('jori') || t.includes('gada')) return wrestlingFallbacks.strength;
  if (t.includes('mud') || t.includes('mitti') || t.includes('kushti')) return wrestlingFallbacks.mud;
  if (t.includes('advanced') || t.includes('competition')) return wrestlingFallbacks.advanced;
  return wrestlingFallbacks.default;
}

/** Shared responsive image classes for program/facility/gallery cards */
export const wrestlingCardImgClass =
  'h-[280px] w-full object-cover object-[center_28%] transition duration-500 group-hover:scale-105 sm:object-[center_32%] md:h-[320px] md:object-center';

import heroImg from '../assets/akhada/hero-wrestlers.webp';
import aboutImg from '../assets/akhada/about-heritage.webp';
import coachesImg from '../assets/akhada/coaches-athletes.png';
import achievementsTrophy from '../assets/akhada/achievements-trophy.webp';
import achievementsMedals from '../assets/akhada/achievements-medals.webp';
import achievementsCelebration from '../assets/akhada/achievements-celebration.webp';
import achievementsPodium from '../assets/akhada/achievements-podium.webp';
import coachKuldeep from '../assets/akhada/coaches/kuldeep-malik.webp';
import coachMahavir from '../assets/akhada/coaches/mahavir-singh.webp';
import coachVikram from '../assets/akhada/coaches/vikram-pehlwan.webp';
import coachAnita from '../assets/akhada/coaches/anita-kakar.webp';

export const images = {
  hero: heroImg,
  about: aboutImg,
  coaches: coachesImg,
  achievementsTrophy,
  achievementsMedals,
  achievementsCelebration,
  achievementsPodium,
};

/** Achievement section showcase images (AI) */
export const achievementVisuals = [
  { key: 'champions', image: achievementsTrophy, position: 'object-[center_18%]' },
  { key: 'medals', image: achievementsMedals, position: 'object-center' },
  { key: 'national', image: achievementsPodium, position: 'object-[center_15%]' },
  { key: 'years', image: achievementsCelebration, position: 'object-[center_22%]' },
];

export const companyInfo = {
  name: 'Kuldeep Malik Sports Academy',
  address: '1554/31, Chhotu Ram Colony, Gohana Road, Sonipat',
  phones: [],
  email: '',
  registrationNo: 'HR/008/2023/01608',
  registrationDate: '10-01-2023',
};

/** Flat list kept for footer / accessibility maps — all destinations preserved */
export const navLinks = [
  { labelKey: 'nav.home', href: '/#home' },
  { labelKey: 'nav.programs', href: '/#programs' },
  { labelKey: 'nav.schedule', href: '/#schedule' },
  { labelKey: 'nav.videos', href: '/#videos' },
  { labelKey: 'nav.gallery', href: '/#gallery' },
  { labelKey: 'nav.facilities', href: '/#facilities' },
  { labelKey: 'nav.features', href: '/#features' },
  { labelKey: 'nav.membership', href: '/#membership' },
  { labelKey: 'nav.coaches', href: '/#coaches' },
  { labelKey: 'nav.achievements', href: '/#achievements' },
  { labelKey: 'nav.governingBody', href: '/#governing-body' },
  { labelKey: 'nav.about', href: '/#about' },
  { labelKey: 'nav.contact', href: '/#contact' },
];

/** Grouped desktop / mobile navigation — every existing section remains reachable */
export const navGroups = [
  {
    id: 'home',
    labelKey: 'nav.home',
    href: '/#home',
  },
  {
    id: 'academy',
    labelKey: 'nav.groups.academy',
    children: [
      { labelKey: 'nav.programs', href: '/#programs' },
      { labelKey: 'nav.schedule', href: '/#schedule' },
      { labelKey: 'nav.facilities', href: '/#facilities' },
      { labelKey: 'nav.features', href: '/#features' },
      { labelKey: 'nav.membership', href: '/#membership' },
    ],
  },
  {
    id: 'training',
    labelKey: 'nav.groups.training',
    children: [
      { labelKey: 'nav.coaches', href: '/#coaches' },
      { labelKey: 'nav.programs', href: '/#programs' },
      { labelKey: 'nav.schedule', href: '/#schedule' },
    ],
  },
  {
    id: 'media',
    labelKey: 'nav.groups.media',
    children: [
      { labelKey: 'nav.videos', href: '/#videos' },
      { labelKey: 'nav.gallery', href: '/#gallery' },
      { labelKey: 'nav.achievements', href: '/#achievements' },
    ],
  },
  {
    id: 'about',
    labelKey: 'nav.groups.about',
    children: [
      { labelKey: 'nav.aboutAcademy', href: '/#about' },
      { labelKey: 'nav.governingBody', href: '/#governing-body' },
      { labelKey: 'nav.contact', href: '/#contact' },
    ],
  },
];

export const aboutPillars = [
  { key: 'heritage' },
  { key: 'discipline' },
  { key: 'technology' },
];

export const features = [
  { key: 'profiles' },
  { key: 'memberships' },
  { key: 'attendance' },
  { key: 'training' },
  { key: 'analytics' },
  { key: 'tournaments' },
  { key: 'coach' },
  { key: 'payments' },
];

export const programTags = ['beginner', 'yoga', 'traditional', 'competition'];

export const facilityTags = ['gym', 'changing', 'competition', 'attendance'];

/** Premium homepage coach cards (Hero → Coaches → Programs) */
export const championCoaches = [
  { key: 'kuldeep', image: coachKuldeep },
  { key: 'mahavir', image: coachMahavir },
  { key: 'vikram', image: coachVikram },
  { key: 'anita', image: coachAnita },
];

export const achievements = [
  { key: 'champions', value: 250, suffix: '+' },
  { key: 'medals', value: 180, suffix: '+' },
  { key: 'national', value: 45, suffix: '+' },
  { key: 'years', value: 30, suffix: '+' },
];

export const testimonials = [
  { key: 'arjun', initial: 'A' },
  { key: 'suresh', initial: 'S' },
  { key: 'meera', initial: 'M' },
];

export const footerProgramKeys = ['beginner', 'advanced', 'strength', 'mud', 'competition'];

export const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'FaFacebookF' },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'FaInstagram' },
  { label: 'YouTube', href: 'https://youtube.com', icon: 'FaYoutube' },
  { label: 'X', href: 'https://x.com', icon: 'FaXTwitter' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'FaLinkedinIn' },
];

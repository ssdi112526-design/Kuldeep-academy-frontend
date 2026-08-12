import heroImg from '../assets/akhada/hero-celebration.webp';
import aboutImg from '../assets/akhada/about-heritage.webp';
import coachesImg from '../assets/akhada/coaches-athletes.png';
import achievementsTrophy from '../assets/akhada/achievements-trophy.webp';
import achievementsMedals from '../assets/akhada/achievements-medals.webp';
import achievementsCelebration from '../assets/akhada/achievements-celebration.webp';
import achievementsPodium from '../assets/akhada/achievements-podium.webp';
import coachKuldeep from '../assets/akhada/coaches/kuldeep-malik.webp';
import coachMahavir from '../assets/akhada/coaches/mahavir-singh.webp';
import wrestlerAthlete1 from '../assets/akhada/wrestlers/athlete-1.png';
import wrestlerAthlete2 from '../assets/akhada/wrestlers/athlete-2.png';
import wrestlerAthlete3 from '../assets/akhada/wrestlers/athlete-3.png';

export const images = {
  hero: heroImg,
  about: aboutImg,
  coaches: coachesImg,
  achievementsTrophy,
  achievementsMedals,
  achievementsCelebration,
  achievementsPodium,
};

export const companyInfo = {
  name: 'Kuldeep Malik Sports Academy',
  address: '1554/31, Chhotu Ram Colony, Gohana   Road, Sonipat, Haryana',
  phones: [],
  email: '',
  registrationNo: 'HR/008/2023/01608',
  registrationDate: '10-01-2023',
};

/** Public website navigation — minimal institutional links only */
export const publicNavLinks = [
  { labelKey: 'nav.home', href: '/#home' },
  { labelKey: 'nav.aboutAcademy', href: '/#about' },
  { labelKey: 'nav.gallery', href: '/#gallery' },
];

export const publicFooterLinks = [
  { labelKey: 'nav.home', href: '/#home' },
  { labelKey: 'nav.aboutAcademy', href: '/#about' },
  { labelKey: 'nav.gallery', href: '/#gallery' },
  { labelKey: 'nav.inquire', href: '/#inquire' },
  { labelKey: 'nav.location', href: '/#location' },
];

/** @deprecated kept for any leftover imports — public site uses publicNavLinks */
export const navLinks = publicNavLinks;
export const navGroups = publicNavLinks.map((l, i) => ({
  id: `link-${i}`,
  labelKey: l.labelKey,
  href: l.href,
}));

export const aboutPillars = [{ key: 'heritage' }, { key: 'training' }, { key: 'strength' }];

/** Homepage coach cards — founder + second coach only */
export const championCoaches = [
  { key: 'kuldeep', image: coachKuldeep, objectPosition: 'object-top' },
  { key: 'mahavir', image: coachMahavir, objectPosition: 'object-[center_28%]' },
];

/** Prestigious members — images from existing assets; copy kept minimal */
export const prestigiousMembers = [
  {
    key: 'sakshi',
    image: heroImg,
    objectPosition: 'object-[center_35%]',
  },
  {
    key: 'gyan',
    image: achievementsPodium,
    objectPosition: 'object-[center_20%]',
  },
];

/** Wrestler showcase — 3 AI-generated academy athlete images */
export const academyWrestlers = [
  { key: 'athlete1', image: wrestlerAthlete1, objectPosition: 'object-top' },
  { key: 'athlete2', image: wrestlerAthlete2, objectPosition: 'object-[center_20%]' },
  { key: 'athlete3', image: wrestlerAthlete3, objectPosition: 'object-center' },
];

export const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'FaFacebookF' },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'FaInstagram' },
  { label: 'YouTube', href: 'https://youtube.com', icon: 'FaYoutube' },
  { label: 'X', href: 'https://x.com', icon: 'FaXTwitter' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'FaLinkedinIn' },
];

/** Kept for unused section modules so admin/legacy imports stay safe */
export const programTags = ['beginner', 'yoga', 'traditional', 'competition'];
export const facilityTags = ['gym', 'changing', 'competition', 'attendance'];
export const testimonials = [{ key: 'arjun' }, { key: 'suresh' }, { key: 'meera' }];
export const achievements = [
  { key: 'champions', value: 0 },
  { key: 'medals', value: 0 },
  { key: 'national', value: 0 },
  { key: 'years', value: 0 },
];
export const achievementVisuals = [
  { key: 'trophy', image: achievementsTrophy },
  { key: 'medals', image: achievementsMedals },
  { key: 'celebration', image: achievementsCelebration },
  { key: 'podium', image: achievementsPodium },
];

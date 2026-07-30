import heroImg from '../assets/akhada/hero-banner.png';
import aboutImg from '../assets/akhada/about-heritage.png';
import coachesImg from '../assets/akhada/coaches-athletes.png';
import coachGuru from '../assets/akhada/coaches/guru-raghunandan.png';
import coachMahavir from '../assets/akhada/coaches/mahavir-singh.png';
import coachVikram from '../assets/akhada/coaches/vikram-pehlwan.png';
import coachArjun from '../assets/akhada/coaches/arjun-pehlwan.png';

export const images = {
  hero: heroImg,
  about: aboutImg,
  coaches: coachesImg,
};

export const companyInfo = {
  name: 'Raghunandan Akhada',
  address: 'P-155, Plot No. 52, Gali No. 5, Phase-4, Shiv Vihar, Karawal Nagar, North East Delhi – 110094',
  phones: ['+91 96540 08400', '+91 96540 08500'],
  email: 'hello@raghunandanakhada.com',
};

/** Nav items use translation keys via labelKey */
export const navLinks = [
  { labelKey: 'nav.home', href: '/#home' },
  { labelKey: 'nav.coaches', href: '/#coaches' },
  { labelKey: 'nav.programs', href: '/#programs' },
  { labelKey: 'nav.videos', href: '/#videos' },
  { labelKey: 'nav.gallery', href: '/#gallery' },
  { labelKey: 'nav.facilities', href: '/#facilities' },
  { labelKey: 'nav.features', href: '/#features' },
  { labelKey: 'nav.achievements', href: '/#achievements' },
  { labelKey: 'nav.contact', href: '/#contact' },
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
  { key: 'guru', image: coachGuru },
  { key: 'mahavir', image: coachMahavir },
  { key: 'vikram', image: coachVikram },
  { key: 'arjun', image: coachArjun },
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

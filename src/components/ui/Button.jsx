import { Link } from 'react-router-dom';

const base =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] px-6 py-3 text-sm font-bold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/55 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary:
    'bg-[#D97706] text-white hover:-translate-y-0.5 hover:bg-[#b45309] shadow-[0_12px_28px_rgba(217,119,6,0.28)]',
  secondary:
    'border border-[#0B3D2E]/20 bg-white text-[#0B3D2E] shadow-[0_4px_14px_rgba(7,26,43,0.06)] hover:-translate-y-0.5 hover:border-[#D97706]/45',
  outline:
    'border border-[#0B3D2E]/20 bg-white text-[#0B3D2E] hover:-translate-y-0.5 hover:border-[#D97706]/50',
  dark:
    'border border-white/30 bg-transparent text-white hover:border-[#F5A400] hover:bg-white/5',
  forest:
    'bg-[#0B3D2E] text-white hover:-translate-y-0.5 hover:bg-[#072A20] shadow-[0_12px_28px_rgba(11,61,46,0.25)]',
  gold:
    'bg-[#F5A400] text-[#03120F] hover:-translate-y-0.5 hover:bg-[#e09500]',
  ghost: 'text-[#64748B] hover:bg-[#E9E7DE]/60 hover:text-[#102033]',
};

export default function Button({
  children,
  variant = 'primary',
  href,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = `${base} ${variants[variant] || variants.primary} ${className}`;

  if (href) {
    const isInternal = href.startsWith('/') || href.startsWith('#');
    const to = href.startsWith('#') ? `/${href}` : href;
    if (isInternal) {
      return (
        <Link to={to} className={classes} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

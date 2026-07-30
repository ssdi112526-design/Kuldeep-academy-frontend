import { Link } from 'react-router-dom';

export default function Button({
  children,
  variant = 'primary',
  href,
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:opacity-60';

  const variants = {
    primary:
      'bg-[#2563EB] text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-[#1D4ED8]',
    secondary:
      'border border-[#E5E7EB] bg-white text-[#111827] shadow-[0_4px_14px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-[#2563EB]/30',
    gold:
      'bg-[#F59E0B] text-white shadow-[0_8px_24px_rgba(245,158,11,0.28)] hover:-translate-y-0.5',
    ghost: 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]',
  };

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

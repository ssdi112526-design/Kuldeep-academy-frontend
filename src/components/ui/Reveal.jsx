import { motion } from 'framer-motion';

export default function Reveal({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = 'center',
  number,
}) {
  const aligned = align === 'left' ? 'text-left' : 'mx-auto max-w-2xl text-center';
  return (
    <div className={`mb-10 md:mb-12 ${aligned}`}>
      <div className={`mb-3 flex items-center gap-3 ${align === 'left' ? '' : 'justify-center'}`}>
        {number ? (
          <span className="font-display text-xs font-bold tracking-[0.18em] text-[#D97706]">{number}</span>
        ) : null}
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D97706]">{eyebrow}</p>
        ) : null}
      </div>
      <h2 className="font-display text-[clamp(1.9rem,4vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-[#071A2B]">
        {title}{' '}
        {highlight ? <span className="text-[#D97706]">{highlight}</span> : null}
      </h2>
      <div className={`accent-rule mt-4 ${align === 'left' ? '' : 'mx-auto'}`} aria-hidden />
      {subtitle ? (
        <p
          className={`mt-4 text-[15px] leading-relaxed text-[#64748B] md:text-base ${
            align === 'left' ? 'max-w-xl' : 'mx-auto max-w-xl'
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

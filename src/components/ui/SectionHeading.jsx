export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  highlight,
  center = true,
  number,
  className = '',
}) {
  return (
    <div className={`mb-10 md:mb-12 ${center ? 'mx-auto max-w-2xl text-center' : ''} ${className}`}>
      <div className={`mb-3 flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        {number ? (
          <span className="font-display text-xs font-bold tracking-[0.18em] text-[#D97706]">{number}</span>
        ) : null}
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D97706]">{eyebrow}</p>
        ) : null}
      </div>
      <h2 className="font-display text-[clamp(1.9rem,4vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-[#071A2B]">
        {title} {highlight ? <span className="text-[#D97706]">{highlight}</span> : null}
      </h2>
      <div className={`accent-rule mt-4 ${center ? 'mx-auto' : ''}`} aria-hidden />
      {subtitle ? (
        <p className={`mt-4 text-base leading-relaxed text-[#64748B] ${center ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

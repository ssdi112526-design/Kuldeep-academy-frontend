import { useMemo } from 'react';

export default function AmbientBackground({ dense = false }) {
  const particles = useMemo(
    () =>
      Array.from({ length: dense ? 36 : 22 }, (_, i) => ({
        id: i,
        left: `${(i * 29) % 100}%`,
        size: 1.5 + (i % 4),
        delay: (i % 12) * 0.4,
        duration: 9 + (i % 8),
        gold: i % 3 === 0,
      })),
    [dense],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="light-blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#2F80ED]/25 blur-[100px]" />
      <div className="light-blob-delay absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-[#F5B041]/15 blur-[110px]" />
      <div className="light-blob absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-[#1B6CFD]/20 blur-[90px]" />
      <div className="ray absolute left-[18%] top-0 h-[55vh] w-24 -rotate-12 opacity-40" />
      <div className="ray absolute left-[48%] top-0 h-[45vh] w-16 rotate-6 opacity-30" />
      <div className="fog absolute inset-x-0 top-1/4 h-48" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle absolute rounded-full"
          style={{
            left: p.left,
            bottom: '-6%',
            width: p.size,
            height: p.size,
            background: p.gold ? '#F5B041' : '#fff',
            opacity: 0.45,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: p.gold
              ? '0 0 8px rgba(245,176,65,0.45)'
              : '0 0 6px rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </div>
  );
}

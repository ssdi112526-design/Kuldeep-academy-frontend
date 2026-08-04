import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaHandshake } from 'react-icons/fa';
import Button from '../ui/Button';
import { images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

const CURVED_TEXT = '॥ आओ, चलें खेल की ओर। ॥';
/** Gentle upper arc in viewBox coordinates */
const ARC_D = 'M 40,190 C 170,78 530,78 660,190';
const VIEW_W = 700;
const VIEW_H = 240;

function segmentGraphemes(text) {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
      return Array.from(seg.segment(text), (s) => s.segment);
    }
  } catch {
    /* fall through */
  }
  // Fallback: keep known Devanagari syllables together where possible
  return text.match(/॥|।|आओ|चलें|खेल|की|ओर|,|\s|./gu) || Array.from(text);
}

/**
 * Safari/WebKit breaks Devanagari inside SVG <textPath>.
 * Place each grapheme cluster as its own <text> along the arc path
 * so shaping stays intact on Chrome, Firefox, Safari, iOS.
 */
function HeroCurvedMantra() {
  const uid = useId().replace(/:/g, '');
  const gradId = `hero-arc-gold-${uid}`;
  const pathRef = useRef(null);
  const svgRef = useRef(null);
  const [glyphs, setGlyphs] = useState([]);

  const clusters = useMemo(() => segmentGraphemes(CURVED_TEXT), []);

  useEffect(() => {
    let cancelled = false;
    const pathEl = pathRef.current;
    const svgEl = svgRef.current;
    if (!pathEl || !svgEl) return undefined;

    const layout = () => {
      if (cancelled || !pathRef.current) return;
      const path = pathRef.current;
      const svgWidth = svgEl.clientWidth || VIEW_W;
      const pxToVb = VIEW_W / Math.max(svgWidth, 1);
      // Target ~26–34px on screen, convert to viewBox units for path placement
      const fontSizeCss = Math.min(34, Math.max(20, svgWidth * 0.05));
      const fontSizeVb = fontSizeCss * pxToVb;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = `700 ${fontSizeCss}px "Noto Sans Devanagari", "Noto Serif Devanagari", sans-serif`;

      const widths = clusters.map((c) => {
        if (c === ' ') return fontSizeVb * 0.28;
        return Math.max(ctx.measureText(c).width * pxToVb, fontSizeVb * 0.35);
      });
      const gap = fontSizeVb * 0.06;
      const totalWidth = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, clusters.length - 1);
      const pathLen = path.getTotalLength();
      let cursor = Math.max(0, (pathLen - totalWidth) / 2);

      const next = clusters.map((char, i) => {
        const w = widths[i];
        const mid = Math.min(pathLen, Math.max(0, cursor + w / 2));
        const pt = path.getPointAtLength(mid);
        const delta = Math.max(1.5, fontSizeVb * 0.1);
        const a = path.getPointAtLength(Math.max(0, mid - delta));
        const b = path.getPointAtLength(Math.min(pathLen, mid + delta));
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        cursor += w + gap;
        return { char, x: pt.x, y: pt.y, angle, fontSize: fontSizeVb };
      });

      setGlyphs(next);
    };

    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (!cancelled) layout();
    };

    run();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => layout()) : null;
    ro?.observe(svgEl);
    window.addEventListener('resize', layout);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener('resize', layout);
    };
  }, [clusters]);

  const fontSize = glyphs[0]?.fontSize || 26;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden pt-14 sm:pt-16 md:pt-20">
      <motion.div
        className="pointer-events-auto absolute right-0 top-[12%] w-[min(92%,560px)] origin-center cursor-default sm:right-[2%] sm:top-[14%] sm:w-[min(70%,600px)] md:right-[4%] md:top-[13%] md:w-[min(58%,640px)] lg:right-[5%] lg:top-[12%] lg:w-[min(52%,680px)] xl:right-[6%] xl:w-[min(48%,700px)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="hero-curved-wrap relative will-change-transform"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-14 w-4/5 -translate-x-1/2 rounded-full bg-[#C79A3B]/18 blur-2xl"
            aria-hidden
          />

          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="hero-curved-svg h-auto w-full overflow-visible"
            role="img"
            aria-label={CURVED_TEXT}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9A6F28" />
                <stop offset="28%" stopColor="#E8C547" />
                <stop offset="55%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#9A6F28" />
              </linearGradient>
            </defs>

            {/* Layout path only — not drawn; never use textPath (Safari Devanagari bug) */}
            <path ref={pathRef} d={ARC_D} fill="none" stroke="none" aria-hidden />

            <title>{CURVED_TEXT}</title>

            {/* Visually hidden full string for accessibility / copy semantics */}
            <text x="-9999" y="-9999" opacity="0" aria-hidden>
              {CURVED_TEXT}
            </text>

            <g fill={`url(#${gradId})`} lang="hi">
              {glyphs.map((g, i) =>
                g.char === ' ' ? null : (
                  <text
                    key={`${i}-${g.char}`}
                    x={g.x}
                    y={g.y}
                    transform={`rotate(${g.angle.toFixed(2)} ${g.x.toFixed(2)} ${g.y.toFixed(2)})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontFamily='"Noto Sans Devanagari", "Noto Serif Devanagari", sans-serif'
                    fontWeight="700"
                    style={{
                      letterSpacing: 'normal',
                      fontKerning: 'normal',
                      textRendering: 'geometricPrecision',
                      userSelect: 'none',
                    }}
                  >
                    {g.char}
                  </text>
                )
              )}
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      className="relative flex min-h-[560px] items-center overflow-hidden bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF] pt-20 md:min-h-[640px] lg:min-h-[720px]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#DBEAFE]/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#2563EB]/25 via-[#38BDF8]/15 to-transparent blur-2xl md:h-[520px] md:w-[520px]"
        aria-hidden
      />

      <div className="absolute inset-0 z-0">
        <img
          src={images.hero}
          alt={t('hero.imageAlt')}
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-[68%_center] md:object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[12%] via-white/88 via-[38%] to-transparent to-[72%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/35 via-transparent to-white/15" />
      </div>

      <HeroCurvedMantra />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl py-16 md:py-20 lg:max-w-[520px] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF]/90 px-3.5 py-1.5 text-[12px] font-semibold text-[#2563EB] shadow-[0_4px_14px_rgba(37,99,235,0.08)] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              {t('hero.badge')}
            </div>

            <h1 className="font-display text-[clamp(2.1rem,4.8vw,3.4rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[#071A35]">
              {t('hero.titleLine1')}
              <br />
              <span className="text-[#2563EB]">{t('hero.titleLine2')}</span>
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6B7280] md:text-base">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#contact" className="rounded-full px-7 py-3.5 text-[15px]">
                {t('hero.ctaPrimary')}
                <FaArrowRight className="text-xs" />
              </Button>
              <Button href="#about" variant="secondary" className="rounded-full px-7 py-3.5 text-[15px]">
                <FaHandshake className="text-[#2563EB]" />
                {t('hero.ctaSecondary')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

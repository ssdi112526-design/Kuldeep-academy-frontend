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
  return text.match(/॥|।|आओ|चलें|खेल|की|ओर|,|\s|./gu) || Array.from(text);
}

/**
 * Safari/WebKit breaks Devanagari inside SVG <textPath>.
 * Place each grapheme cluster as its own <text> along the arc path.
 */
function HeroCurvedMantra({ className = '' }) {
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
      const fontSizeCss = Math.min(34, Math.max(18, svgWidth * 0.048));
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
    <div className={`pointer-events-none absolute inset-x-0 top-0 z-[2] overflow-visible px-2 pt-1 ${className}`}>
      <motion.div
        className="pointer-events-auto mx-auto w-full max-w-[340px] origin-center cursor-default opacity-95 sm:max-w-[420px] md:max-w-[480px] lg:max-w-[520px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="hero-curved-wrap relative will-change-transform"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-12 w-4/5 -translate-x-1/2 rounded-full bg-[#C79A3B]/16 blur-2xl"
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

            <path ref={pathRef} d={ARC_D} fill="none" stroke="none" aria-hidden />
            <title>{CURVED_TEXT}</title>
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

function HeroCopy() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF]/95 px-3 py-1.5 text-[11px] font-semibold text-[#2563EB] shadow-[0_4px_14px_rgba(37,99,235,0.08)] backdrop-blur-sm sm:mb-5 sm:px-3.5 sm:text-[12px]">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
        <span className="truncate">{t('hero.badge')}</span>
      </div>

      <h1 className="font-display text-[clamp(1.85rem,6.2vw,3.4rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[#071A35]">
        {t('hero.titleLine1')}
        <br />
        <span className="text-[#2563EB]">{t('hero.titleLine2')}</span>
      </h1>

      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#6B7280] sm:mt-4 sm:text-[15px] md:text-base">
        {t('hero.subtitle')}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
        <Button href="#contact" className="w-full rounded-full px-7 py-3.5 text-[15px] sm:w-auto">
          {t('hero.ctaPrimary')}
          <FaArrowRight className="text-xs" />
        </Button>
        <Button
          href="#about"
          variant="secondary"
          className="w-full rounded-full px-7 py-3.5 text-[15px] sm:w-auto"
        >
          <FaHandshake className="text-[#2563EB]" />
          {t('hero.ctaSecondary')}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      className="relative overflow-x-hidden bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF] pt-20"
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#DBEAFE]/40 to-transparent md:h-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-32 hidden h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#2563EB]/25 via-[#38BDF8]/15 to-transparent blur-2xl md:block md:h-[520px] md:w-[520px]"
        aria-hidden
      />

      {/* ========== Desktop / large tablet: full-bleed image ========== */}
      <div className="absolute inset-0 z-0 hidden lg:block">
        <img
          src={images.hero}
          alt=""
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
          aria-hidden
          className="h-full w-full object-cover object-[70%_center] xl:object-[66%_center] 2xl:object-[62%_center]"
        />
        <div
          className="absolute inset-y-0 left-0 w-[min(100%,580px)] bg-gradient-to-r from-white from-[50%] via-white/92 via-[82%] to-transparent"
          aria-hidden
        />
      </div>

      {/* Desktop mantra — over right image area only */}
      <div className="pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden lg:block">
        <div className="absolute right-[3%] top-[12%] w-[min(46%,620px)] xl:right-[5%] xl:w-[min(44%,660px)]">
          <HeroCurvedMantra className="!static !inset-auto !px-0 !pt-0" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 py-8 sm:gap-8 sm:py-10 md:py-12 lg:min-h-[600px] lg:grid-cols-2 lg:gap-10 lg:py-16 xl:min-h-[640px]">
          {/* Copy */}
          <div className="relative z-20 max-w-xl lg:max-w-[520px]">
            <HeroCopy />
          </div>

          {/* ========== Mobile / tablet image (clear, no wash) ========== */}
          <motion.div
            className="relative z-10 w-full min-w-0 lg:hidden"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-[22px] bg-[#F8FAFC] shadow-[0_12px_32px_rgba(0,0,0,0.08)] sm:rounded-[28px]">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[2]">
                <HeroCurvedMantra />
              </div>
              <div className="relative aspect-[16/11] w-full sm:aspect-[16/10]">
                <img
                  src={images.hero}
                  alt={t('hero.imageAlt')}
                  width={1200}
                  height={750}
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover object-[62%_center] sm:object-[58%_center]"
                />
              </div>
            </div>
          </motion.div>

          {/* Desktop spacer so grid balances with absolute bg image */}
          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}

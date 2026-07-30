import { useEffect, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import Reveal from '../ui/Reveal';
import VideoPlayerModal from '../ui/VideoPlayerModal';
import VideoHoverCard from './VideoHoverCard';
import useTranslation from '../../hooks/useTranslation';
import { videoService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';

export default function Videos() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await videoService.listPublic();
        if (!alive) return;
        setVideos(res.data.data.videos || []);
        setFeatured(res.data.data.featured || null);
      } catch {
        if (alive) setError(t('videos.loadError'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  const openVideo = async (video) => {
    setActive(video);
    if (video.slug) {
      try {
        await videoService.getBySlug(video.slug);
      } catch {
        /* views optional */
      }
    }
  };

  const gridVideos = featured
    ? videos.filter((v) => (v._id || v.id) !== (featured._id || featured.id))
    : videos;

  return (
    <section
      id="videos"
      className="relative overflow-hidden section bg-gradient-to-b from-[#FFFcf7] via-[#FBF8F1] to-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 25%, #D4AF37 0.8px, transparent 0.9px), radial-gradient(circle at 85% 70%, #8B5E3C 0.7px, transparent 0.8px)',
          backgroundSize: '30px 30px, 40px 40px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8860B] shadow-[0_4px_14px_rgba(212,175,55,0.12)]">
              {t('videos.badge')}
            </span>
            <h2 className="mt-4 font-display text-[clamp(1.85rem,3.8vw,2.75rem)] font-bold leading-tight tracking-tight text-[#1A120B]">
              {t('videos.titleLine1')}{' '}
              <span className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#8B5E3C] bg-clip-text text-transparent">
                {t('videos.titleLine2')}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#6B5E52] md:text-base">
              {t('videos.subtitle')}
            </p>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-[24px] bg-[#EFE6D8]/80" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </p>
        ) : (
          <>
            {featured ? (
              <Reveal>
                <article
                  className="group relative mb-10 cursor-pointer overflow-hidden rounded-[28px] border border-[#D4AF37]/25 shadow-[0_18px_50px_rgba(26,18,11,0.12)] transition duration-350 hover:shadow-[0_22px_56px_rgba(212,175,55,0.28)]"
                  onClick={() => openVideo(featured)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openVideo(featured);
                  }}
                >
                  <div className="relative min-h-[280px] md:min-h-[420px]">
                    <img
                      src={mediaUrl(featured.thumbnail)}
                      alt={featured.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1A120B]/85 via-[#1A120B]/55 to-[#1A120B]/25" />
                    <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-end p-6 md:min-h-[420px] md:p-10">
                      <span className="mb-3 w-fit rounded-full bg-[#D4AF37] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1A120B]">
                        {t('videos.featured')}
                      </span>
                      <h3 className="max-w-xl font-display text-2xl font-bold text-white md:text-4xl">
                        {featured.title}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
                        {featured.subtitle || featured.description}
                      </p>
                      <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#1A120B] shadow-[0_8px_24px_rgba(212,175,55,0.35)]">
                        <FaPlay className="text-xs" />
                        {t('videos.watchNow')}
                      </span>
                    </div>
                    <span className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#B8860B] shadow-xl md:h-20 md:w-20">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#D4AF37]/30" />
                      <FaPlay className="relative ml-1" />
                    </span>
                  </div>
                </article>
              </Reveal>
            ) : null}

            {gridVideos.length === 0 && !featured ? (
              <p className="text-center text-sm text-[#6B5E52]">{t('videos.empty')}</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridVideos.map((video, i) => (
                  <Reveal key={video._id || video.id} delay={(i % 3) * 0.06}>
                    <VideoHoverCard video={video} onPlay={openVideo} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <VideoPlayerModal video={active} onClose={() => setActive(null)} />
    </section>
  );
}

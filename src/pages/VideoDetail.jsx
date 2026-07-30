import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaUserTie } from 'react-icons/fa';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import VideoPlayerModal from '../components/ui/VideoPlayerModal';
import PageLoader from '../components/ui/PageLoader';
import useTranslation from '../hooks/useTranslation';
import { videoService } from '../services';
import { mediaUrl } from '../utils/mediaUrl';

export default function VideoDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await videoService.getBySlug(slug);
        if (!alive) return;
        setVideo(res.data.data.video || res.data.data);
      } catch {
        if (alive) setError(t('videos.notFound'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, t]);

  if (loading) {
    return <PageLoader message="Loading video..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFcf7] via-[#FBF8F1] to-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/#videos"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#8B5E3C] hover:text-[#B8860B]"
        >
          <FaArrowLeft className="text-xs" />
          {t('videos.backToVideos')}
        </Link>

        {error || !video ? (
          <p className="mt-10 text-center text-sm text-red-600">{error || t('videos.notFound')}</p>
        ) : (
          <article className="mt-6 overflow-hidden rounded-[28px] border border-[#E8DFD0] bg-white shadow-[0_18px_50px_rgba(26,18,11,0.08)]">
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative block w-full overflow-hidden"
            >
              <img
                src={mediaUrl(video.thumbnail)}
                alt={video.title}
                className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#1A120B]/35" />
              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#B8860B] shadow-xl">
                <FaPlay className="ml-1" />
              </span>
              {video.duration ? (
                <span className="absolute bottom-4 right-4 rounded-md bg-[#1A120B]/85 px-2.5 py-1 text-xs font-semibold text-white">
                  {video.duration}
                </span>
              ) : null}
            </button>
            <div className="p-6 md:p-8">
              <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#B8860B]">
                {video.category}
              </span>
              <h1 className="mt-3 font-display text-2xl font-bold text-[#1A120B] md:text-3xl">
                {video.title}
              </h1>
              {video.subtitle ? (
                <p className="mt-2 text-base text-[#8B5E3C]">{video.subtitle}</p>
              ) : null}
              <p className="mt-4 text-sm leading-relaxed text-[#6B5E52] md:text-base">
                {video.description}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#8B5E3C]">
                {video.coachName ? (
                  <span className="inline-flex items-center gap-1">
                    <FaUserTie /> {video.coachName}
                  </span>
                ) : null}
                {video.createdAt ? (
                  <span>{new Date(video.createdAt).toLocaleDateString('en-IN')}</span>
                ) : null}
                {typeof video.views === 'number' ? (
                  <span>
                    {video.views} {t('videos.views')}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#1A120B] shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition hover:-translate-y-0.5"
              >
                <FaPlay className="text-xs" />
                {t('videos.watchNow')}
              </button>
            </div>
          </article>
        )}
      </main>
      <Footer />
      <VideoPlayerModal video={playing ? video : null} onClose={() => setPlaying(false)} />
    </div>
  );
}

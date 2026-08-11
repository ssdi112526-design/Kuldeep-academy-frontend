import { useEffect, useRef, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

/** Only one hover preview plays at a time across all cards */
let activePreviewId = null;
const previewListeners = new Set();

function setActivePreview(id) {
  activePreviewId = id;
  previewListeners.forEach((fn) => fn(id));
}

function useCanHover() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setOk(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return ok;
}

export default function VideoHoverCard({ video, onPlay }) {
  const canHover = useCanHover();
  const videoRef = useRef(null);
  const hoverTimer = useRef(null);
  const [previewing, setPreviewing] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const id = video._id || video.id;
  const thumb = video.thumbnail ? mediaUrl(video.thumbnail) : '';
  const src = video.videoFile ? mediaUrl(video.videoFile) : '';

  useEffect(() => {
    const onActive = (activeId) => {
      if (activeId !== id && videoRef.current) {
        videoRef.current.pause();
        try {
          videoRef.current.currentTime = 0;
        } catch {
          /* ignore */
        }
        setPreviewing(false);
      }
    };
    previewListeners.add(onActive);
    return () => {
      previewListeners.delete(onActive);
      clearTimeout(hoverTimer.current);
    };
  }, [id]);

  useEffect(() => {
    if (!previewing || !shouldLoad) return undefined;
    const el = videoRef.current;
    if (!el) return undefined;

    let cancelled = false;
    const play = async () => {
      try {
        el.muted = true;
        if (el.readyState >= 1) {
          el.currentTime = Math.min(2, el.duration || 2);
        }
        await el.play();
      } catch {
        if (!cancelled) setPreviewing(false);
      }
    };

    const onLoaded = () => {
      try {
        el.currentTime = Math.min(2, el.duration || 2);
      } catch {
        /* ignore */
      }
      play();
    };

    if (el.readyState >= 2) play();
    else el.addEventListener('loadeddata', onLoaded, { once: true });

    return () => {
      cancelled = true;
      el.removeEventListener('loadeddata', onLoaded);
    };
  }, [previewing, shouldLoad]);

  const startPreview = () => {
    if (!canHover || !src) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setActivePreview(id);
      setShouldLoad(true);
      setPreviewing(true);
    }, 120);
  };

  const stopPreview = () => {
    clearTimeout(hoverTimer.current);
    const el = videoRef.current;
    if (el) {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    setPreviewing(false);
    if (activePreviewId === id) setActivePreview(null);
  };

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-md border border-[#E8DFD0]/80 bg-white/55 shadow-[0_12px_36px_rgba(26,18,11,0.08)] backdrop-blur-md transition-all duration-[350ms] ease-out hover:-translate-y-2 hover:border-[#D4AF37]/70 hover:shadow-[0_20px_48px_rgba(212,175,55,0.28)]"
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
      onClick={() => onPlay(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#1A120B]">
        {thumb ? (
          <img
            src={thumb}
            alt={video.title}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-[350ms] ${
              previewing ? 'scale-105 opacity-0' : 'scale-100 opacity-100 group-hover:scale-[1.03]'
            }`}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a2a1a] to-[#1A120B]" />
        )}

        {src && shouldLoad ? (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-all duration-[350ms] ${
              previewing ? 'scale-[1.03] opacity-100' : 'scale-100 opacity-0'
            }`}
            src={src}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A120B]/70 via-transparent to-transparent" />

        <span className="absolute left-3 top-3 rounded-full bg-[#1A120B]/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          {video.category}
        </span>

        {video.duration ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-[#1A120B]/85 px-2 py-1 text-[11px] font-semibold text-white">
            {video.duration}
          </span>
        ) : null}

        <span
          className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#B8860B] shadow-lg transition-all duration-[350ms] ${
            previewing ? 'scale-75 opacity-0' : 'scale-100 opacity-100 group-hover:scale-110'
          }`}
        >
          <FaPlay className="ml-0.5 text-sm" />
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-base font-bold text-[#1A120B] transition group-hover:text-[#B8860B]">
          {video.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-[#6B5E52]">
          {video.subtitle || video.description}
        </p>
      </div>
    </article>
  );
}

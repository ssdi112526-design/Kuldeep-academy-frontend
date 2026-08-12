import { useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';
import { getYoutubeEmbedUrl, getVimeoEmbedUrl } from '../../utils/videoUtils';

export default function VideoPlayerModal({ video, onClose }) {
  const videoRef = useRef(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [video]);

  useEffect(() => {
    if (!video) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const el = videoRef.current;
      if (!el) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        if (el.paused) el.play();
        else el.pause();
      } else if (e.key === 'ArrowRight') {
        el.currentTime = Math.min(el.duration || 0, el.currentTime + 5);
      } else if (e.key === 'ArrowLeft') {
        el.currentTime = Math.max(0, el.currentTime - 5);
      } else if (e.key === 'f') {
        if (document.fullscreenElement) document.exitFullscreen();
        else el.requestFullscreen?.();
      } else if (e.key === 'm') {
        el.muted = !el.muted;
      } else if (e.key === 'p' && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) document.exitPictureInPicture();
        else el.requestPictureInPicture?.();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [video, onClose]);

  if (!video) return null;

  const youtube = getYoutubeEmbedUrl(video.youtubeUrl);
  const vimeo = getVimeoEmbedUrl(video.vimeoUrl);
  const mp4 = video.videoFile ? mediaUrl(video.videoFile) : null;
  const hasSource = Boolean(mp4 || youtube || vimeo);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0704]/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-5 top-5 rounded-full bg-white/95 p-3 text-[#1A120B] shadow"
        aria-label="Close"
        onClick={onClose}
      >
        <FaTimes />
      </button>

      <div
        className="w-full max-w-5xl overflow-hidden rounded-[24px] bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-video w-full bg-black">
          {mp4 && !broken ? (
            <video
              ref={videoRef}
              key={mp4}
              src={mp4}
              controls
              autoPlay
              playsInline
              preload="metadata"
              controlsList="nodownload"
              className="h-full w-full"
              poster={video.thumbnail ? mediaUrl(video.thumbnail) : undefined}
              onError={() => setBroken(true)}
            />
          ) : !mp4 && (youtube || vimeo) ? (
            <iframe
              title={video.title}
              src={youtube || vimeo}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-sm text-white/70">
              {hasSource
                ? 'This video file is missing on the server (often after a redeploy). Please re-upload it from Admin → Videos.'
                : 'No playable source available.'}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#1A120B] px-5 py-4 text-white">
          <div>
            <h3 className="font-display text-lg font-bold">{video.title}</h3>
            {video.subtitle ? <p className="mt-1 text-sm text-white/70">{video.subtitle}</p> : null}
          </div>
          {mp4 && !broken ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-white/80">
                Speed
                <select
                  className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-white"
                  defaultValue="1"
                  onChange={(e) => {
                    if (videoRef.current) videoRef.current.playbackRate = Number(e.target.value);
                  }}
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}x
                    </option>
                  ))}
                </select>
              </label>
              {typeof document !== 'undefined' && document.pictureInPictureEnabled ? (
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-white/90 hover:bg-white/10"
                  onClick={() => videoRef.current?.requestPictureInPicture?.()}
                >
                  PiP
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

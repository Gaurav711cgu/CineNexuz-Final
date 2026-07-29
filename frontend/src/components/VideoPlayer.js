import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, PictureInPicture2, Play, Volume2, VolumeX, X } from 'lucide-react';
import { continueWatchingAPI, recommendationsAPI } from '../lib/api';

const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';

function loadHlsScript() {
  if (window.Hls) return Promise.resolve(window.Hls);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${HLS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Hls));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = HLS_SRC;
    script.async = true;
    script.onload = () => resolve(window.Hls);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function VideoPlayer({ streamUrl, movieId, resumePosition = 0, movieTitle, onClose }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(resumePosition || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [showUpNext, setShowUpNext] = useState(false);
  const [upNext, setUpNext] = useState([]);

  const progressPercent = useMemo(() => duration ? Math.min((currentTime / duration) * 100, 100) : 0, [currentTime, duration]);
  const canSkipIntro = currentTime >= 30 && currentTime <= 90;

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      const video = videoRef.current;
      if (!video) return;
      if (!streamUrl.endsWith('.m3u8') || video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else {
        const Hls = await loadHlsScript();
        if (cancelled || !Hls?.isSupported()) return;
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setLevels(data.levels || []);
        });
      }
    }
    setup();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [streamUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (resumePosition) video.currentTime = resumePosition;
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = async () => {
      setShowUpNext(true);
      try {
        const response = await recommendationsAPI.personalized(6);
        setUpNext(response.data.movies || []);
      } catch {
        setUpNext([]);
      }
    };
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [movieId, resumePosition]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.duration || video.paused) return;
      continueWatchingAPI.updateSeconds(movieId, Math.floor(video.currentTime), Math.floor(video.duration)).catch(() => {});
    }, 30000);
    return () => window.clearInterval(interval);
  }, [movieId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const video = videoRef.current;
      if (!video) return;
      if (event.code === 'Space') {
        event.preventDefault();
        video.paused ? video.play() : video.pause();
      } else if (event.code === 'ArrowLeft') {
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else if (event.code === 'ArrowRight') {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
      } else if (event.key.toLowerCase() === 'f') {
        containerRef.current?.requestFullscreen?.();
      } else if (event.key.toLowerCase() === 'm') {
        video.muted = !video.muted;
        setMuted(video.muted);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const changeVolume = (value) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Number(value);
    setVolume(Number(value));
    setMuted(Number(value) === 0);
  };

  const seek = (value) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(value);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  };

  const changeQuality = (value) => {
    const level = Number(value);
    setSelectedLevel(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black text-white">
      <video ref={videoRef} className="h-full w-full object-contain bg-black" playsInline />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-5">
        <div className="text-lg font-medium">{movieTitle}</div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Close player">
          <X size={20} />
        </button>
      </div>

      {canSkipIntro && (
        <button
          onClick={() => seek(Math.min(duration || 0, currentTime + 90))}
          className="absolute right-6 bottom-28 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Skip Intro
        </button>
      )}

      {showUpNext && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
          <div className="max-w-3xl text-center">
            <div className="mb-4 text-2xl font-semibold">Up Next</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {upNext.map((movie) => (
                <div key={movie._id} className="rounded-md border border-white/10 bg-white/5 p-3 text-left">
                  <div className="text-sm font-medium">{movie.title}</div>
                  <div className="mt-1 text-xs text-white/60">{movie.recommendation_reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(event) => seek(event.target.value)}
          className="mb-4 w-full"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={togglePlay} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Play or pause">
            {playing ? <Pause size={20} /> : <Play size={20} fill="white" />}
          </button>
          <button onClick={toggleMute} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Mute">
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(event) => changeVolume(event.target.value)} className="w-24" />
          <div className="text-sm text-white/70">{formatTime(currentTime)} / {formatTime(duration)}</div>
          {levels.length > 0 && (
            <select value={selectedLevel} onChange={(event) => changeQuality(event.target.value)} className="ml-auto rounded-md bg-white/10 px-3 py-2 text-sm">
              <option value={-1}>Auto</option>
              {levels.map((level, index) => (
                <option key={`${level.height}-${index}`} value={index}>
                  {level.height ? `${level.height}p` : `Level ${index + 1}`}
                </option>
              ))}
            </select>
          )}
          <button onClick={togglePictureInPicture} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Picture in picture">
            <PictureInPicture2 size={20} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-full bg-white/10 hover:bg-white/20" aria-label="Fullscreen">
            {document.fullscreenElement ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded bg-white/10">
          <div className="h-full bg-red-600" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

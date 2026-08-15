import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Sliders,
  Mic,
  MicOff
} from 'lucide-react';
import type { SubtitleSegment, SubtitleStyle, DubbingSettings } from '../types/video';
import { drawSubtitleOnCanvas } from '../services/exportService';
import { ttsService } from '../services/ttsService';
import { VIETNAMESE_VOICES } from '../mockData/sampleVideos';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: SubtitleSegment[];
  style: SubtitleStyle;
  dubbing: DubbingSettings;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  selectedSegmentId?: string | null;
  onSelectSegment?: (id: string) => void;
  onUpdateDubbing: (settings: Partial<DubbingSettings>) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  subtitles,
  style,
  dubbing,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  onUpdateDubbing
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showMixer, setShowMixer] = useState(false);
  const [currentSub, setCurrentSub] = useState<SubtitleSegment | undefined>(undefined);
  const [isDubbingMuted, setIsDubbingMuted] = useState(false);

  const lastSpokenSubIdRef = useRef<string | null>(null);

  // Sync internal time and find active subtitle
  useEffect(() => {
    const active = subtitles.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
    setCurrentSub(active);

    // Audio Ducking & TTS playback with Auto Speed Sync
    if (isPlaying && active && !isDubbingMuted && dubbing.dubbingVolume > 0) {
      if (active.id !== lastSpokenSubIdRef.current) {
        lastSpokenSubIdRef.current = active.id;
        
        const voice = VIETNAMESE_VOICES.find((v) => v.id === dubbing.selectedVoiceId) || VIETNAMESE_VOICES[0];
        const segmentDuration = Math.max(0.5, active.endTime - active.startTime);

        // Duck original video volume
        if (videoRef.current && dubbing.enableAudioDucking) {
          videoRef.current.volume = Math.max(0.05, dubbing.originalVolume * dubbing.duckingLevel);
        }

        // Safety timeout to ensure video volume is ALWAYS restored
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.volume = dubbing.originalVolume;
          }
        }, Math.round((segmentDuration + 1.2) * 1000));

        ttsService.speak(
          active.vietnameseText,
          voice,
          dubbing,
          () => {
            // TTS started
          },
          () => {
            // Restore video volume when TTS finishes
            if (videoRef.current) {
              videoRef.current.volume = dubbing.originalVolume;
            }
          },
          segmentDuration
        );
      }
    }
  }, [currentTime, isPlaying, subtitles, dubbing, isDubbingMuted]);

  // Stop TTS only when video pauses
  useEffect(() => {
    if (!isPlaying) {
      ttsService.stop();
      if (videoRef.current) {
        videoRef.current.volume = dubbing.originalVolume;
      }
    }
  }, [isPlaying, dubbing.originalVolume]);

  // Handle Video Time Updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      onTimeUpdate(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      onDurationChange(dur);
      videoRef.current.volume = dubbing.originalVolume;
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      ttsService.unlockAudio();
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      ttsService.stop();
    }
  };

  // Seek time
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
      ttsService.stop();
      lastSpokenSubIdRef.current = null;
    }
  };

  // Change playback speed
  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // Format time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Live Canvas Subtitle Rendering with Karaoke Word-by-Word
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentSub) {
      drawSubtitleOnCanvas(ctx, canvas.width, canvas.height, currentSub, style, currentTime);
    }
  }, [currentSub, style, currentTime]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Video & Canvas Overlay Screen */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            ttsService.stop();
          }}
          onEnded={() => {
            setIsPlaying(false);
            ttsService.stop();
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {/* Live Subtitle Canvas */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        />

        {/* Center Play/Pause Indicator (when paused) */}
        {!isPlaying && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(37, 99, 235, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)',
            backdropFilter: 'blur(6px)',
            transition: 'transform 0.2s ease'
          }}>
            <Play size={32} fill="#ffffff" style={{ marginLeft: '4px' }} />
          </div>
        )}

        {/* Live Dubbing & Auto-Speed Indicator */}
        {isPlaying && currentSub && !isDubbingMuted && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            backgroundColor: 'rgba(17, 24, 39, 0.92)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} className="animate-pulse-subtle" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>
              🎙️ Khớp Tốc Độ Video ({Math.max(0.5, currentSub.endTime - currentSub.startTime).toFixed(1)}s)
            </span>
          </div>
        )}
      </div>

      {/* Player Control Bar */}
      <div style={{
        padding: '0.85rem 1.25rem',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {/* Progress Timeline Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            style={{
              flex: 1,
              height: '6px',
              accentColor: 'var(--brand-primary)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Action Controls & Mixer Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={togglePlay}
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} fill="#ffffff" />}
              <span>{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  onTimeUpdate(0);
                  ttsService.stop();
                  lastSpokenSubIdRef.current = null;
                }
              }}
              className="btn-secondary"
              title="Phát lại từ đầu"
              style={{ padding: '0.45rem 0.75rem' }}
            >
              <RotateCcw size={15} />
            </button>

            {/* Dubbing Quick Toggle Button */}
            <button
              onClick={() => {
                const nextMuted = !isDubbingMuted;
                setIsDubbingMuted(nextMuted);
                if (nextMuted) ttsService.stop();
              }}
              className="btn-secondary"
              title={isDubbingMuted ? 'Bật giọng đọc lồng tiếng' : 'Tắt tạm thời giọng lồng tiếng'}
              style={{
                padding: '0.45rem 0.75rem',
                backgroundColor: isDubbingMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                borderColor: isDubbingMuted ? '#ef4444' : '#10b981',
                color: isDubbingMuted ? '#f87171' : '#34d399'
              }}
            >
              {isDubbingMuted ? <MicOff size={15} /> : <Mic size={15} />}
              <span style={{ fontSize: '0.75rem' }}>{isDubbingMuted ? 'Tắt Lồng Tiếng' : 'Bật Lồng Tiếng'}</span>
            </button>

            {/* Speed Selector */}
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-main)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changeSpeed(rate)}
                  style={{
                    backgroundColor: playbackRate === rate ? 'var(--brand-primary)' : 'transparent',
                    color: playbackRate === rate ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.2rem 0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Audio Mixer Toggle */}
            <button
              onClick={() => setShowMixer(!showMixer)}
              className="btn-secondary"
              style={{
                borderColor: showMixer ? 'var(--border-active)' : 'var(--border-subtle)',
                color: showMixer ? '#60a5fa' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem'
              }}
            >
              <Sliders size={15} />
              <span>Mixer & Tốc Độ</span>
            </button>

            <button
              onClick={toggleFullScreen}
              className="btn-secondary"
              title="Toàn màn hình"
              style={{ padding: '0.45rem 0.75rem' }}
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Collapsible Audio Mixer Panel */}
        {showMixer && (
          <div style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginTop: '0.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* Auto Speed Sync Option */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="auto-speed-toggle"
                checked={dubbing.autoSpeedSync}
                onChange={(e) => onUpdateDubbing({ autoSpeedSync: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <label htmlFor="auto-speed-toggle" style={{ fontSize: '0.8rem', color: '#ffffff', cursor: 'pointer' }}>
                <strong style={{ color: '#34d399' }}>⚡ Tự Động Khớp Tốc Độ (Auto Speed Sync)</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Tự động tăng tốc giọng đọc khi người trong video nói nhanh để kịp từng câu
                </div>
              </label>
            </div>

            {/* Audio Ducking Option */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="ducking-toggle"
                checked={dubbing.enableAudioDucking}
                onChange={(e) => onUpdateDubbing({ enableAudioDucking: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
              />
              <label htmlFor="ducking-toggle" style={{ fontSize: '0.8rem', color: '#ffffff', cursor: 'pointer' }}>
                <strong>Audio Ducking</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Hạ âm lượng video gốc khi giọng lồng tiếng phát
                </div>
              </label>
            </div>

            {/* Original Video Volume */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  🇨🇳 Âm lượng video gốc:
                </span>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700 }}>
                  {Math.round(dubbing.originalVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={dubbing.originalVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateDubbing({ originalVolume: val });
                  if (videoRef.current) videoRef.current.volume = val;
                }}
                style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
              />
            </div>

            {/* AI Dubbing Volume */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  🇻🇳 Âm lượng lồng tiếng:
                </span>
                <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
                  {Math.round(dubbing.dubbingVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={dubbing.dubbingVolume}
                onChange={(e) => onUpdateDubbing({ dubbingVolume: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

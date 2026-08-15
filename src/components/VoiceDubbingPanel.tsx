import React, { useState } from 'react';
import { Mic, Check, Play, Sparkles, Radio, CheckCircle2, Zap } from 'lucide-react';
import type { DubbingSettings } from '../types/video';
import { VIETNAMESE_VOICES } from '../mockData/sampleVideos';
import { ttsService } from '../services/ttsService';

interface VoiceDubbingPanelProps {
  dubbing: DubbingSettings;
  onUpdateDubbing: (updated: Partial<DubbingSettings>) => void;
}

export const VoiceDubbingPanel: React.FC<VoiceDubbingPanelProps> = ({
  dubbing,
  onUpdateDubbing
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePreviewVoice = (voiceId: string) => {
    setPlayingVoiceId(voiceId);
    ttsService.previewVoice(voiceId, dubbing);
    setTimeout(() => {
      setPlayingVoiceId(null);
    }, 4500);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-subtle)',
      padding: '1.25rem'
    }}>
      {/* Title & Engine Mode */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mic size={18} color="#34d399" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
            Cấu Hình Lồng Tiếng AI & Đồng Bộ Tốc Độ Video
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
            <CheckCircle2 size={11} /> Cloud Voice Engine (100% Hoạt Động)
          </span>
        </div>
      </div>

      {/* Auto Speed Sync Feature Box */}
      <div style={{
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
          <Zap size={20} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              ⚡ Tự Động Khớp Tốc Độ Theo Video (Auto Speed Sync)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
              Khi nhân vật trong video nói nhanh hoặc thời lượng câu ngắn, AI tự động tăng/giảm tốc độ đọc tiếng Việt để hoàn thành <strong>đúng khớp từng mốc giây</strong>, không bao giờ bị nói chậm hay đè câu sau.
            </div>
          </div>
        </div>

        <input
          type="checkbox"
          id="panel-auto-speed"
          checked={dubbing.autoSpeedSync}
          onChange={(e) => onUpdateDubbing({ autoSpeedSync: e.target.checked })}
          style={{ width: '20px', height: '20px', accentColor: '#10b981', cursor: 'pointer', flexShrink: 0 }}
        />
      </div>

      {/* TTS Engine Selector Tabs */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          Công nghệ phát âm giọng đọc:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onUpdateDubbing({ ttsEngine: 'cloud' })}
            style={{
              backgroundColor: dubbing.ttsEngine === 'cloud' || dubbing.ttsEngine === 'auto' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
              borderColor: dubbing.ttsEngine === 'cloud' || dubbing.ttsEngine === 'auto' ? '#10b981' : 'var(--border-subtle)',
              color: dubbing.ttsEngine === 'cloud' || dubbing.ttsEngine === 'auto' ? '#34d399' : 'var(--text-secondary)',
              border: '1.5px solid',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} />
              <span>Cloud AI Voice Stream (Khuyên dùng)</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Chuẩn âm điệu tiếng Việt tự nhiên, tương thích 100% trên mọi trình duyệt
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateDubbing({ ttsEngine: 'system' })}
            style={{
              backgroundColor: dubbing.ttsEngine === 'system' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
              borderColor: dubbing.ttsEngine === 'system' ? 'var(--brand-primary)' : 'var(--border-subtle)',
              color: dubbing.ttsEngine === 'system' ? '#60a5fa' : 'var(--text-secondary)',
              border: '1.5px solid',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Radio size={13} />
              <span>Web Speech API (Hệ thống)</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sử dụng giọng đọc cài sẵn trong Windows / macOS
            </div>
          </button>
        </div>
      </div>

      {/* Voice Selection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {VIETNAMESE_VOICES.map((voice) => {
          const isSelected = dubbing.selectedVoiceId === voice.id;
          const isPlaying = playingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onUpdateDubbing({ selectedVoiceId: voice.id })}
              style={{
                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                border: `1.5px solid ${isSelected ? '#10b981' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    {voice.name}
                  </span>
                  <span
                    className={`badge ${
                      voice.region === 'north'
                        ? 'badge-brand'
                        : voice.region === 'central'
                        ? 'badge-purple'
                        : voice.region === 'special'
                        ? 'badge-green'
                        : 'badge-yellow'
                    }`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {voice.region === 'north'
                      ? 'Miền Bắc'
                      : voice.region === 'central'
                      ? 'Miền Trung'
                      : voice.region === 'special'
                      ? 'Đặc Biệt'
                      : 'Miền Nam'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {voice.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice.id);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    backgroundColor: isPlaying ? '#10b981' : 'rgba(0,0,0,0.3)',
                    color: isPlaying ? '#ffffff' : 'inherit',
                    borderColor: isPlaying ? '#10b981' : 'var(--border-subtle)'
                  }}
                >
                  <Play size={11} fill={isPlaying ? '#ffffff' : '#34d399'} color={isPlaying ? '#ffffff' : '#34d399'} />
                  <span>{isPlaying ? 'Đang phát...' : 'Nghe thử giọng'}</span>
                </button>

                {isSelected && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Adjustments (Rate, Pitch, Ducking) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        backgroundColor: 'var(--bg-card)',
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Speed / Rate */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tốc độ cơ bản:</span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{dubbing.speechRate}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.05"
            value={dubbing.speechRate}
            onChange={(e) => onUpdateDubbing({ speechRate: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#10b981' }}
          />
        </div>

        {/* Pitch / Tone */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cao độ giọng (Pitch):</span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{dubbing.pitch}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={dubbing.pitch}
            onChange={(e) => onUpdateDubbing({ pitch: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#10b981' }}
          />
        </div>

        {/* Ducking Level */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mức hạ nhạc nền (Ducking):</span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
              {Math.round(dubbing.duckingLevel * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={dubbing.duckingLevel}
            onChange={(e) => onUpdateDubbing({ duckingLevel: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#10b981' }}
          />
        </div>
      </div>
    </div>
  );
};

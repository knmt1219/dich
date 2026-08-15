import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import type { SubtitleStyle } from '../types/video';

interface SubtitleStylePanelProps {
  style: SubtitleStyle;
  onUpdateStyle: (updated: Partial<SubtitleStyle>) => void;
}

const PRESET_COLORS = [
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Vàng rực', value: '#fde047' },
  { label: 'Xanh ngọc', value: '#67e8f9' },
  { label: 'Hồng pastel', value: '#f472b6' },
  { label: 'Xanh lá', value: '#86efac' }
];

const PRESET_HIGHLIGHT_COLORS = [
  { label: 'Vàng Neon', value: '#fde047' },
  { label: 'Xanh Cyan', value: '#38bdf8' },
  { label: 'Xanh Neon', value: '#4ade80' },
  { label: 'Cam Đỏ', value: '#fb923c' },
  { label: 'Tím Hồng', value: '#f472b6' }
];

const PRESET_BACKGROUNDS = [
  { label: 'Không nền', value: 'transparent' },
  { label: 'Nền đen mờ 50%', value: 'rgba(0, 0, 0, 0.5)' },
  { label: 'Nền đen đậm 85%', value: 'rgba(0, 0, 0, 0.85)' },
  { label: 'Nền xanh đậm', value: 'rgba(15, 23, 42, 0.85)' }
];

export const SubtitleStylePanel: React.FC<SubtitleStylePanelProps> = ({
  style,
  onUpdateStyle
}) => {
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={18} color="#60a5fa" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
            Tùy Chỉnh Kiểu Dáng Phụ Đề & Karaoke
          </h3>
        </div>
      </div>

      {/* Karaoke Word-by-Word Highlight Feature Box */}
      <div style={{
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        border: '1px solid rgba(37, 99, 235, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={17} color="#fde047" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                Karaoke Highlight (Đọc theo từng chữ)
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Tự động làm sáng từng từ tiếng Việt theo nhịp độ giọng lồng tiếng
              </div>
            </div>
          </div>

          <input
            type="checkbox"
            id="karaoke-toggle"
            checked={style.enableKaraoke}
            onChange={(e) => onUpdateStyle({ enableKaraoke: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
          />
        </div>

        {style.enableKaraoke && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Màu chữ phát sáng khi đọc đến:
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESET_HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.value}
                  type="button"
                  onClick={() => onUpdateStyle({ highlightColor: hc.value })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    backgroundColor: style.highlightColor === hc.value ? 'rgba(0,0,0,0.4)' : 'var(--bg-card)',
                    border: `1.5px solid ${style.highlightColor === hc.value ? hc.value : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.3rem 0.55rem',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: hc.value }} />
                  <span>{hc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Display Mode Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          Chế độ hiển thị ngôn ngữ:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[
            { id: 'vi-only', label: 'Chỉ Tiếng Việt' },
            { id: 'bilingual', label: 'Song ngữ Trung - Việt' },
            { id: 'zh-only', label: 'Chỉ Tiếng Trung' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onUpdateStyle({ displayMode: mode.id as SubtitleStyle['displayMode'] })}
              style={{
                backgroundColor: style.displayMode === mode.id ? 'var(--brand-primary)' : 'var(--bg-card)',
                borderColor: style.displayMode === mode.id ? 'var(--brand-primary)' : 'var(--border-subtle)',
                color: style.displayMode === mode.id ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Adjustments */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        backgroundColor: 'var(--bg-card)',
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Font Size */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cỡ chữ (Font Size):</span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{style.fontSize}px</span>
          </div>
          <input
            type="range"
            min="18"
            max="42"
            step="1"
            value={style.fontSize}
            onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
          />
        </div>

        {/* Position Y */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vị trí dọc (Position Y):</span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{style.positionY}%</span>
          </div>
          <input
            type="range"
            min="15"
            max="92"
            step="1"
            value={style.positionY}
            onChange={(e) => onUpdateStyle({ positionY: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
          />
        </div>

        {/* Stroke Outline */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Độ dày viền đen:</span>
            <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>{style.strokeWidth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="0.5"
            value={style.strokeWidth}
            onChange={(e) => onUpdateStyle({ strokeWidth: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
          />
        </div>
      </div>

      {/* Colors & Presets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Màu chữ chính:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onUpdateStyle({ primaryColor: c.value })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--bg-card)',
                  border: `1.5px solid ${style.primaryColor === c.value ? '#3b82f6' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.35rem 0.65rem',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c.value, border: '1px solid #000' }} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Hộp nền phụ đề:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PRESET_BACKGROUNDS.map((bg) => (
              <button
                key={bg.value}
                onClick={() => onUpdateStyle({ backgroundColor: bg.value })}
                style={{
                  backgroundColor: style.backgroundColor === bg.value ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-card)',
                  borderColor: style.backgroundColor === bg.value ? '#3b82f6' : 'var(--border-subtle)',
                  color: style.backgroundColor === bg.value ? '#60a5fa' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

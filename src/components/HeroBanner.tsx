import React from 'react';
import { Sparkles, CheckCircle2, Play, UploadCloud } from 'lucide-react';

interface HeroBannerProps {
  onStartUpload: () => void;
  onSelectPreset: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onStartUpload, onSelectPreset }) => {
  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '3.5rem',
      paddingBottom: '3.5rem',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.18), transparent 70%)'
    }}>
      <div className="container-custom">
        <div style={{
          maxWidth: '850px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Tagline Badge */}
          <div className="badge badge-brand animate-pulse-subtle" style={{ marginBottom: '1.25rem' }}>
            <Sparkles size={13} />
            <span>AI Subtitles & Voice Dubbing Trung - Việt Cho Web</span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.04em',
            marginBottom: '1.25rem',
            color: '#ffffff'
          }}>
            Dịch Phụ Đề & Lồng Tiếng Video Trung Quốc Sang Tiếng Việt
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '720px',
            marginBottom: '2rem'
          }}>
            Tải lên video Douyin, Kuaishou, Bilibili, review hoặc phim ngắn. Hệ thống AI tự động bóc tách lời thoại tiếng Trung, dịch ngữ cảnh mượt mà sang tiếng Việt và lồng tiếng AI đa vùng miền, xuất file <strong style={{ color: '#ffffff' }}>MP4</strong> & <strong style={{ color: '#ffffff' }}>SRT</strong> chỉ trong tích tắc.
          </p>

          {/* Call to Actions */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '2.5rem'
          }}>
            <button
              onClick={onStartUpload}
              className="btn-primary"
              style={{
                fontSize: '1rem',
                padding: '0.85rem 2rem',
                gap: '0.75rem'
              }}
            >
              <UploadCloud size={20} />
              <span>Tải Video Lên Để Dịch</span>
            </button>

            <button
              onClick={onSelectPreset}
              className="btn-secondary"
              style={{
                fontSize: '0.95rem',
                padding: '0.85rem 1.65rem',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                borderColor: '#334155'
              }}
            >
              <Play size={18} fill="#3b82f6" color="#3b82f6" />
              <span>Thử Nhanh Với Video Mẫu</span>
            </button>
          </div>

          {/* Features Highlights */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#3b82f6" />
              <span>Nhận diện giọng nói tiếng Trung chuẩn xác</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#3b82f6" />
              <span>Dịch ngữ cảnh Hán-Việt & Từ lóng Douyin</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#3b82f6" />
              <span>Lồng tiếng AI giọng Bắc / Nam tự nhiên</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#3b82f6" />
              <span>Xuất MP4 gắn phụ đề & File SRT/VTT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

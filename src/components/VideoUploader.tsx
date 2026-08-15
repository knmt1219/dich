import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Sparkles, Play, Clock, Check } from 'lucide-react';
import type { SampleVideo } from '../types/video';
import { SAMPLE_CHINESE_VIDEOS } from '../mockData/sampleVideos';

interface VideoUploaderProps {
  onVideoSelected: (file: File | null, url: string, sampleData?: SampleVideo) => void;
  isProcessing: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      onVideoSelected(file, url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onVideoSelected(file, url);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrlInput.trim()) {
      onVideoSelected(null, videoUrlInput.trim());
    }
  };

  const handleSampleClick = (sample: SampleVideo) => {
    onVideoSelected(null, sample.videoUrl, sample);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.08)' : 'rgba(23, 32, 51, 0.6)',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)'
        }}>
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>
          Kéo thả video tiếng Trung vào đây hoặc <span style={{ color: '#3b82f6', textDecoration: 'underline' }}>Chọn tệp từ máy</span>
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '450px', marginBottom: '1rem' }}>
          Hỗ trợ định dạng MP4, WebM, MOV, MKV. Video Douyin, Kuaishou, vlog, phim ngắn tiếng Trung (tối đa 2GB).
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>MP4</span>
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>WebM</span>
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>MOV</span>
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>Douyin / TikTok 9:16</span>
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>16:9 HD</span>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleUrlSubmit} style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ paddingLeft: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <LinkIcon size={18} />
        </div>
        <input
          type="url"
          placeholder="Hoặc dán trực tiếp đường dẫn video (https://.../video.mp4)"
          value={videoUrlInput}
          onChange={(e) => setVideoUrlInput(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!videoUrlInput.trim() || isProcessing}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <span>Nhập URL</span>
        </button>
      </form>

      {/* Sample Chinese Videos Preset */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#f59e0b" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Hoặc trải nghiệm ngay 1-Click với Video Mẫu Tiếng Trung:
            </h4>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Đã kèm sẵn phụ đề song ngữ & lồng tiếng
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}>
          {SAMPLE_CHINESE_VIDEOS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '120px', overflow: 'hidden' }}>
                <img
                  src={sample.thumbnail}
                  alt={sample.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem'
                }}>
                  <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                    {sample.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Clock size={12} />
                    <span>{sample.duration}s</span>
                  </div>
                </div>

                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  backdropFilter: 'blur(4px)'
                }}>
                  <Play size={16} fill="#ffffff" />
                </div>
              </div>

              <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                  {sample.title}
                </h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                  {sample.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Check size={13} />
                  <span>{sample.subtitles.length} câu thoại song ngữ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

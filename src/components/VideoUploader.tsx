import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon } from 'lucide-react';
import type { SampleVideo } from '../types/video';

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
    </div>
  );
};

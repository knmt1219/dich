import React from 'react';
import { Sparkles, Key, Video, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  onScrollToEditor: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenApiKeyModal, onScrollToEditor, hasApiKey }) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container-custom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: 'inherit'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              color: '#ffffff'
            }}>
              <Video size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                DichVid<span style={{ color: '#3b82f6' }}>.AI</span>
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Dịch phụ đề & Lồng tiếng Trung - Việt
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
               onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              Quy trình 3 bước
            </a>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
               onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              Tính năng AI
            </a>
            <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
               onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
               onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              Hỏi đáp (FAQ)
            </a>
          </nav>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onOpenApiKeyModal}
            className="btn-secondary"
            title="Cài đặt API Key Gemini / OpenAI"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              borderColor: hasApiKey ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
              color: hasApiKey ? '#34d399' : 'var(--text-secondary)'
            }}
          >
            <Key size={15} />
            <span style={{ display: 'inline-block' }}>
              {hasApiKey ? 'Đã nối Gemini API' : 'Cài đặt API Key'}
            </span>
          </button>

          <button
            onClick={onScrollToEditor}
            className="btn-primary"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
          >
            <Sparkles size={16} />
            <span>Tải Video Dịch Ngay</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Video, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-main)',
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: '3.5rem',
      paddingBottom: '2.5rem'
    }}>
      <div className="container-custom">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Video size={18} />
            </div>
            <div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                DichVid<span style={{ color: '#3b82f6' }}>.AI</span>
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Công cụ dịch phụ đề & lồng tiếng video Trung - Việt thông minh
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="badge badge-brand" style={{ fontSize: '0.8rem' }}>
            <Sparkles size={13} />
            <span>Tối ưu hóa cho Douyin, Kuaishou, TikTok & YouTube</span>
          </div>
        </div>

        <div style={{
          paddingTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          gap: '1rem'
        }}>
          <p>© 2026 DichVid.AI. Nền tảng dịch thuật & lồng tiếng video Trung - Việt thông minh cho người sáng tạo nội dung.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Tính năng</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

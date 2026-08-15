import React from 'react';
import { UploadCloud, Sparkles, Download } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '1',
      icon: <UploadCloud size={24} color="#3b82f6" />,
      title: 'Tải Video Tiếng Trung Lên',
      desc: 'Tải trực tiếp video MP4, WebM từ máy tính hoặc dán link video Douyin, Kuaishou, phim truyền hình Trung Quốc.'
    },
    {
      number: '2',
      icon: <Sparkles size={24} color="#3b82f6" />,
      title: 'AI Nhận Diện & Dịch Ngữ Cảnh',
      desc: 'Hệ thống tự động bóc tách giọng nói tiếng Trung thành timeline song ngữ, dịch sang tiếng Việt tự nhiên và lồng tiếng đa giọng đọc.'
    },
    {
      number: '3',
      icon: <Download size={24} color="#3b82f6" />,
      title: 'Xuất MP4, SRT Hoặc Audio',
      desc: 'Tải về video hoàn chỉnh gắn phụ đề cứng & lồng tiếng mượt mà, hoặc xuất file phụ đề SRT/VTT để đưa vào CapCut, Premiere.'
    }
  ];

  return (
    <section id="how-it-works" style={{
      paddingTop: '5rem',
      paddingBottom: '5rem',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container-custom">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '0.75rem' }}>
            Chỉ <span style={{ color: 'var(--brand-primary)' }}>3 Bước Đơn Giản</span> Để Dịch & Lồng Tiếng Video
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Quy trình hoàn toàn tự động, nhanh chóng và dễ sử dụng ngay trên trình duyệt web của bạn.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'var(--border-active)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.08)' }}>
                  {step.number}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

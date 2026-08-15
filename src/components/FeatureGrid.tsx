import React from 'react';
import { Mic, Languages, Volume2, Edit3, Sliders, FileDown } from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: <Mic size={22} color="#3b82f6" />,
      title: 'Nhận Diện Giọng Nói Tiếng Trung',
      desc: 'Bóc tách lời thoại tiếng Trung phổ thông (Mandarin) tự động theo từng mili-giây, chính xác cả câu nói nhanh và từ địa phương.'
    },
    {
      icon: <Languages size={22} color="#3b82f6" />,
      title: 'Dịch Ngữ Cảnh Chuẩn Sắc Thái',
      desc: 'Dịch tự nhiên theo văn phong đời thường, phim điện ảnh hoặc review công nghệ. Giữ trọn nghĩa từ lóng Douyin và thành ngữ Hán-Việt.'
    },
    {
      icon: <Volume2 size={22} color="#3b82f6" />,
      title: 'Lồng Tiếng AI Đa Vùng Miền',
      desc: 'Giọng đọc tự nhiên Hà Nội và Sài Gòn (Nam/Nữ) với ngữ điệu truyền cảm, tự động đồng bộ tốc độ khớp từng khuôn miệng.'
    },
    {
      icon: <Edit3 size={22} color="#3b82f6" />,
      title: 'Studio Biên Tập Phụ Đề Song Ngữ',
      desc: 'Giao diện chỉnh sửa trực quan: xem chữ Hán, Pinyin và bản dịch tiếng Việt song song. Dễ dàng sửa từ, tách/gộp và chỉnh thời gian.'
    },
    {
      icon: <Sliders size={22} color="#3b82f6" />,
      title: 'Audio Ducking Tự Động',
      desc: 'Công nghệ tự động giảm âm lượng video gốc khi giọng lồng tiếng cất lên và nâng lại nhạc nền khi hết câu, chuẩn phòng thu.'
    },
    {
      icon: <FileDown size={22} color="#3b82f6" />,
      title: 'Xuất File Linh Hoạt Đa Nhu Cầu',
      desc: 'Tải về video MP4 đã gắn phụ đề cứng, file phụ đề chuẩn SRT/VTT để đưa vào CapCut hoặc file âm thanh giọng đọc MP3.'
    }
  ];

  return (
    <section id="features" style={{
      paddingTop: '5rem',
      paddingBottom: '5rem',
      backgroundColor: 'rgba(17, 24, 39, 0.4)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container-custom">
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '0.75rem' }}>
            Bộ Công Cụ AI Chuyên Biệt Cho Video Trung - Việt
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Tối ưu hóa toàn diện cho các nhà sáng tạo nội dung TikTok, YouTube Shorts, Douyin Re-up, dịch phim và review sản phẩm.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {features.map((item, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'Tôi có cần cài đặt phần mềm hay ứng dụng riêng không?',
      answer: 'Không. DichVid AI chạy hoàn toàn trên trình duyệt web của bạn (máy tính hoặc điện thoại). Bạn chỉ cần mở trình duyệt, tải video tiếng Trung lên hoặc chọn video mẫu để bắt đầu dịch và lồng tiếng ngay lập tức.'
    },
    {
      question: 'Hệ thống dịch video tiếng Trung có chuẩn ngữ cảnh và từ lóng không?',
      answer: 'Có! Hệ thống tích hợp mô hình ngôn ngữ lớn kết hợp từ điển ngữ cảnh chuyên sâu cho video Douyin, Kuaishou, phim điện ảnh và review. Bản dịch đảm bảo giữ đúng sắc thái tự nhiên, từ ngữ đời sống và Hán-Việt mượt mà thay vì dịch thô cứng từng từ.'
    },
    {
      question: 'Tôi có thể tải file phụ đề về dùng trên CapCut, Premiere hoặc YouTube không?',
      answer: 'Hoàn toàn được! Bạn có thể xuất file phụ đề chuẩn SRT hoặc VTT (chọn bản dịch Tiếng Việt hoặc Song ngữ Trung - Việt) để import 1-click vào CapCut, Premiere Pro, Final Cut hoặc tải lên phụ đề YouTube, TikTok.'
    },
    {
      question: 'Tính năng Audio Ducking (Hạ âm lượng video gốc) hoạt động như thế nào?',
      answer: 'Audio Ducking là kỹ thuật chuẩn phòng thu giúp tự động giảm âm lượng của video gốc tiếng Trung xuống mức vừa đủ khi giọng lồng tiếng tiếng Việt cất lên, và tự động hồi phục âm thanh nền khi câu nói kết thúc, tạo cảm giác thuyết minh chuyên nghiệp.'
    },
    {
      question: 'Tôi có thể dùng Google Gemini API Key miễn phí không?',
      answer: 'Có! Bạn có thể lấy Gemini API Key miễn phí từ Google AI Studio và nhập vào nút "Cài đặt API Key" trên thanh điều hướng để hệ thống gọi trực tiếp AI dịch ngữ cảnh tốc độ cao với độ dài không giới hạn.'
    },
    {
      question: 'Định dạng video đầu vào nào được hỗ trợ?',
      answer: 'Hệ thống hỗ trợ tất cả các định dạng video phổ biến như MP4, WebM, MOV, MKV với tỷ lệ khung hình 9:16 (video dọc TikTok/Douyin) và 16:9 (video ngang YouTube HD).'
    }
  ];

  return (
    <section id="faq" style={{
      paddingTop: '5rem',
      paddingBottom: '5rem',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container-custom">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
          <div className="badge badge-brand" style={{ marginBottom: '1rem' }}>
            <HelpCircle size={13} />
            <span>Giải Đáp Thắc Mắc</span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '0.75rem' }}>
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Mọi thông tin cần thiết về quy trình dịch phụ đề và lồng tiếng video AI.
          </p>
        </div>

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isOpen ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '1.2rem 1.5rem',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <span>{faq.question}</span>
                  <div style={{ color: isOpen ? '#60a5fa' : 'var(--text-muted)' }}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '1rem'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

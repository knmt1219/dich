import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Volume2,
  Sparkles,
  Languages,
  Clock,
  Search,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  ArrowUpCircle,
  List,
  Compass
} from 'lucide-react';
import type { SubtitleSegment, TranslationTone, DubbingSettings, GeminiModel } from '../types/video';
import { translateChineseWithGemini, getStoredApiKey } from '../services/aiService';
import { ttsService } from '../services/ttsService';
import { VIETNAMESE_VOICES } from '../mockData/sampleVideos';

interface SubtitleEditorProps {
  subtitles: SubtitleSegment[];
  currentTime: number;
  selectedSegmentId: string | null;
  dubbing: DubbingSettings;
  translationTone: TranslationTone;
  geminiModel: GeminiModel;
  onOpenApiKeyModal: () => void;
  onSelectSegment: (id: string, time?: number) => void;
  onUpdateSegment: (id: string, updated: Partial<SubtitleSegment>) => void;
  onDeleteSegment: (id: string) => void;
  onAddSegment: () => void;
  onBatchTranslate: (tone: TranslationTone) => Promise<void>;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  subtitles,
  currentTime,
  selectedSegmentId,
  dubbing,
  translationTone,
  geminiModel,
  onOpenApiKeyModal,
  onSelectSegment,
  onUpdateSegment,
  onDeleteSegment,
  onAddSegment,
  onBatchTranslate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'rollup' | 'list'>('rollup');
  
  // Smart User-controlled Scrolling (Does NOT fight the user when scrolling manually!)
  const [autoFollowVideo, setAutoFollowVideo] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const hasApiKey = Boolean(getStoredApiKey().geminiKey);

  const filteredSubtitles = subtitles.filter(
    (s) =>
      s.vietnameseText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.chineseText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.pinyin && s.pinyin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Active Subtitle Index
  const activeIndex = filteredSubtitles.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  // SMART AUTO-SCROLL: Only scrolls when autoFollowVideo is TRUE
  useEffect(() => {
    if (autoFollowVideo && scrollContainerRef.current && activeIndex >= 0) {
      const container = scrollContainerRef.current;
      const activeEl = container.children[activeIndex] as HTMLElement;
      if (activeEl) {
        isProgrammaticScrollRef.current = true;
        const containerHeight = container.clientHeight;
        const activeOffset = activeEl.offsetTop;
        const activeHeight = activeEl.offsetHeight;
        const targetScrollTop = activeOffset - (containerHeight / 2) + (activeHeight / 2);
        
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });

        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
      }
    }
  }, [activeIndex, autoFollowVideo]);

  // Detect manual user scrolling (pause auto-follow so user can freely scroll down/up)
  const handleUserScroll = () => {
    if (!isProgrammaticScrollRef.current) {
      // User is scrolling manually with mousewheel or touch
      if (autoFollowVideo) {
        setAutoFollowVideo(false);
      }
    }
  };

  const handleResumeAutoFollow = () => {
    setAutoFollowVideo(true);
    if (scrollContainerRef.current && activeIndex >= 0) {
      const container = scrollContainerRef.current;
      const activeEl = container.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const containerHeight = container.clientHeight;
        const activeOffset = activeEl.offsetTop;
        const activeHeight = activeEl.offsetHeight;
        const targetScrollTop = activeOffset - (containerHeight / 2) + (activeHeight / 2);
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      }
    }
  };

  const handleSpeakSegment = (sub: SubtitleSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    const voice = VIETNAMESE_VOICES.find((v) => v.id === dubbing.selectedVoiceId) || VIETNAMESE_VOICES[0];
    const segmentDuration = Math.max(0.5, sub.endTime - sub.startTime);
    ttsService.speak(sub.vietnameseText, voice, dubbing, undefined, undefined, segmentDuration);
  };

  const handleAiTranslateSingle = async (sub: SubtitleSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    setTranslatingId(sub.id);
    try {
      const translated = await translateChineseWithGemini(sub.chineseText, translationTone, geminiModel);
      onUpdateSegment(sub.id, { vietnameseText: translated });
      setFeedbackToast({ type: 'success', message: 'Dịch câu thành công với chất lượng cao!' });
      setTimeout(() => setFeedbackToast(null), 2500);
    } catch {
      setFeedbackToast({ type: 'error', message: 'Lỗi khi dịch câu!' });
      setTimeout(() => setFeedbackToast(null), 2500);
    } finally {
      setTranslatingId(null);
    }
  };

  const handleTranslateAllClick = async (tone: TranslationTone) => {
    setIsTranslatingAll(true);
    try {
      await onBatchTranslate(tone);
      setFeedbackToast({ type: 'success', message: `Đã dịch toàn bộ ${subtitles.length} câu với chất lượng tốt nhất!` });
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch {
      setFeedbackToast({ type: 'error', message: 'Lỗi khi dịch hàng loạt.' });
      setTimeout(() => setFeedbackToast(null), 3000);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* Fixed Top Toolbar Bar */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        backgroundColor: 'var(--bg-card)',
        flexShrink: 0
      }}>
        {/* Row 1: Gemini Status Bar & Translate All */}
        <div style={{
          backgroundColor: hasApiKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${hasApiKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.45rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {hasApiKey ? (
              <CheckCircle2 size={15} color="#34d399" />
            ) : (
              <AlertCircle size={15} color="#fbbf24" />
            )}
            <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 600 }}>
              {hasApiKey
                ? `AI Dịch Thuật Chuẩn Cao Cấp (${geminiModel})`
                : 'Đang dùng Bộ Dịch Đám Mây Tự Động (Nhập Key để dùng Gemini 1.5 Pro)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={onOpenApiKeyModal}
              className="btn-secondary"
              style={{
                padding: '0.22rem 0.5rem',
                fontSize: '0.7rem',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderColor: hasApiKey ? '#34d399' : '#fbbf24',
                color: hasApiKey ? '#34d399' : '#fbbf24'
              }}
            >
              <Key size={11} />
              <span>{hasApiKey ? 'Đổi Key' : 'Nhập Key AI'}</span>
            </button>

            <button
              onClick={() => handleTranslateAllClick(translationTone)}
              disabled={isTranslatingAll}
              className="btn-primary"
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.7rem',
                backgroundColor: '#2563eb',
                gap: '0.3rem'
              }}
            >
              {isTranslatingAll ? (
                <Loader2 size={12} className="audio-bar" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>
                {isTranslatingAll ? 'Đang dịch...' : '🚀 Dịch Toàn Bộ Video (Chất Lượng Cao)'}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackToast && (
          <div style={{
            padding: '0.3rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 600,
            backgroundColor: feedbackToast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: feedbackToast.type === 'success' ? '#34d399' : '#f87171',
            border: `1px solid ${feedbackToast.type === 'success' ? '#10b981' : '#ef4444'}`
          }}>
            {feedbackToast.message}
          </div>
        )}

        {/* Row 2: Roll-up Mode Toggle, Auto-Scroll Switch & Subtitle Count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Languages size={15} color="#3b82f6" />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
              Danh Sách Câu Thoại ({subtitles.length} câu)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* Auto Follow Toggle Button */}
            <button
              onClick={() => setAutoFollowVideo(!autoFollowVideo)}
              className="btn-secondary"
              title="Bật/Tắt tự động cuộn bám theo video đang phát"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.68rem',
                backgroundColor: autoFollowVideo ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                borderColor: autoFollowVideo ? '#3b82f6' : 'var(--border-subtle)',
                color: autoFollowVideo ? '#60a5fa' : 'var(--text-muted)'
              }}
            >
              <Compass size={11} />
              <span>Bám Video: {autoFollowVideo ? 'BẬT' : 'TẮT'}</span>
            </button>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              <button
                onClick={() => setViewMode('rollup')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: viewMode === 'rollup' ? 'var(--brand-primary)' : 'transparent',
                  color: viewMode === 'rollup' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ArrowUpCircle size={11} />
                <span>Cuộn Lên</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: viewMode === 'list' ? 'var(--brand-primary)' : 'transparent',
                  color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <List size={11} />
                <span>Danh Sách</span>
              </button>
            </div>

            <button
              onClick={onAddSegment}
              className="btn-secondary"
              style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem' }}
            >
              <Plus size={12} />
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* Search & Tone */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            minWidth: '130px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.22rem 0.55rem'
          }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Tìm kiếm phụ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.75rem',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {(['natural', 'cinematic', 'news', 'humorous'] as TranslationTone[]).map((tone) => (
              <button
                key={tone}
                onClick={() => handleTranslateAllClick(tone)}
                disabled={isTranslatingAll}
                className="btn-secondary"
                style={{
                  padding: '0.22rem 0.4rem',
                  fontSize: '0.68rem',
                  backgroundColor: translationTone === tone ? 'rgba(37, 99, 235, 0.25)' : 'var(--bg-main)',
                  borderColor: translationTone === tone ? 'var(--brand-primary)' : 'var(--border-subtle)',
                  color: translationTone === tone ? '#60a5fa' : 'var(--text-secondary)'
                }}
              >
                <span>
                  {tone === 'natural'
                    ? 'Tự nhiên'
                    : tone === 'cinematic'
                    ? 'Điện ảnh'
                    : tone === 'news'
                    ? 'Review'
                    : 'Hài hước'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtitles Scrollable Area (Allows free manual scroll without jumping back!) */}
      <div
        ref={scrollContainerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        onScroll={handleUserScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          scrollBehavior: 'smooth'
        }}
      >
        {filteredSubtitles.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            Không tìm thấy dòng phụ đề nào.
          </div>
        ) : (
          filteredSubtitles.map((sub, index) => {
            const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
            const isPast = currentTime > sub.endTime;
            const isSelected = selectedSegmentId === sub.id;
            const segmentDuration = Math.max(0.5, sub.endTime - sub.startTime);
            const dynamicRate = ttsService.calculateDynamicRate(sub.vietnameseText, segmentDuration, dubbing.speechRate);
            const progress = isActive ? Math.max(0, Math.min(1, (currentTime - sub.startTime) / segmentDuration)) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => {
                  onSelectSegment(sub.id, sub.startTime);
                  setAutoFollowVideo(true);
                }}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  minHeight: '140px',
                  backgroundColor: isActive
                    ? 'rgba(37, 99, 235, 0.22)'
                    : isPast && viewMode === 'rollup'
                    ? 'rgba(15, 23, 42, 0.55)'
                    : 'var(--bg-card)',
                  opacity: isPast && viewMode === 'rollup' ? 0.8 : 1,
                  border: `1.5px solid ${
                    isActive
                      ? '#3b82f6'
                      : isSelected
                      ? 'rgba(96, 165, 250, 0.6)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.85rem',
                  transition: 'all 0.25s ease',
                  transform: isActive ? 'scale(1.01)' : 'scale(1)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                  boxShadow: isActive ? '0 0 20px rgba(37, 99, 235, 0.4)' : 'none',
                  overflow: 'hidden'
                }}
              >
                {/* Active Sentence Real-time Progress Bar */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: 'rgba(59, 130, 246, 0.25)'
                  }}>
                    <div style={{
                      width: `${progress * 100}%`,
                      height: '100%',
                      backgroundColor: '#38bdf8',
                      boxShadow: '0 0 10px #38bdf8'
                    }} />
                  </div>
                )}

                {/* Row 1: Time range & Quick Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{
                      fontWeight: 700,
                      color: isActive ? '#60a5fa' : 'var(--text-muted)',
                      backgroundColor: 'var(--bg-main)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      #{index + 1}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                      <Clock size={12} />
                      <input
                        type="number"
                        step="0.1"
                        value={sub.startTime}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateSegment(sub.id, { startTime: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '45px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          padding: '1px 3px',
                          textAlign: 'center'
                        }}
                      />
                      <span>s ➔</span>
                      <input
                        type="number"
                        step="0.1"
                        value={sub.endTime}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateSegment(sub.id, { endTime: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '45px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          padding: '1px 3px',
                          textAlign: 'center'
                        }}
                      />
                      <span>s ({segmentDuration.toFixed(1)}s)</span>
                    </div>

                    {/* Dynamic Auto Speed Badge */}
                    {dubbing.autoSpeedSync && (
                      <span className="badge badge-brand" style={{ fontSize: '0.65rem', padding: '1px 5px', gap: '2px' }}>
                        <Zap size={10} color="#60a5fa" />
                        <span>{dynamicRate}x</span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {/* Speak Button */}
                    <button
                      onClick={(e) => handleSpeakSegment(sub, e)}
                      className="btn-secondary"
                      title="Nghe thử giọng đọc tiếng Việt"
                      style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      <Volume2 size={13} color="#34d399" />
                      <span>Nghe</span>
                    </button>

                    {/* AI Single Translate Button */}
                    <button
                      onClick={(e) => handleAiTranslateSingle(sub, e)}
                      disabled={translatingId === sub.id}
                      className="btn-secondary"
                      title="Dịch lại chuẩn ngữ cảnh bằng AI"
                      style={{ padding: '0.22rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      <Sparkles size={13} color="#f59e0b" />
                      <span>{translatingId === sub.id ? 'Đang dịch...' : 'Dịch'}</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSegment(sub.id);
                      }}
                      className="btn-secondary"
                      title="Xóa câu này"
                      style={{ padding: '0.22rem 0.4rem', color: '#f87171' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Row 2: Chinese Original & Pinyin */}
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid #f59e0b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>
                      🇨🇳 Tiếng Trung gốc:
                    </span>
                    {sub.pinyin && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {sub.pinyin}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={sub.chineseText}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateSegment(sub.id, { chineseText: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#fef08a',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-chinese)',
                      fontWeight: 500
                    }}
                  />
                </div>

                {/* Row 3: Vietnamese Translation (Editable) */}
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 600 }}>
                      🇻🇳 Bản dịch Tiếng Việt (Lồng tiếng):
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={sub.vietnameseText}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateSegment(sub.id, { vietnameseText: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                      lineHeight: 1.4
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Pill Button to Re-sync with Active Video Sentence when User has scrolled away */}
      {!autoFollowVideo && activeIndex >= 0 && (
        <button
          onClick={handleResumeAutoFollow}
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '0.45rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.5)',
            cursor: 'pointer',
            zIndex: 10,
            animation: 'pulse 2s infinite'
          }}
        >
          <Compass size={13} />
          <span>📍 Cuộn về câu đang phát (#{activeIndex + 1})</span>
        </button>
      )}
    </div>
  );
};

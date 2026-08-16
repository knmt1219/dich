import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Volume2,
  Sparkles,
  Languages,
  Search,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpCircle,
  List,
  Compass,
  ClipboardPaste,
  X
} from 'lucide-react';
import type { SubtitleSegment, TranslationTone, DubbingSettings, GeminiModel } from '../types/video';
import { translateSingleSegmentWithGemini, parseAnyTranscriptText, getStoredApiKey } from '../services/aiService';
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
  onImportSubtitles?: (subs: SubtitleSegment[]) => void;
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
  onBatchTranslate,
  onImportSubtitles
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'rollup' | 'list'>('rollup');
  const [autoFollowVideo, setAutoFollowVideo] = useState(true);

  // Paste Transcript Modal State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

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
      const activeEl = scrollContainerRef.current.querySelector(`[data-sub-idx="${activeIndex}"]`) as HTMLElement;
      if (activeEl) {
        isProgrammaticScrollRef.current = true;
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 400);
      }
    }
  }, [activeIndex, autoFollowVideo]);

  // Detect user manual scroll to disable auto-follow temporarily
  const handleUserScroll = () => {
    if (!isProgrammaticScrollRef.current && autoFollowVideo) {
      setAutoFollowVideo(false);
    }
  };

  const handlePreviewSegmentVoice = (sub: SubtitleSegment) => {
    ttsService.unlockAudio();
    const voice = VIETNAMESE_VOICES.find(v => v.id === dubbing.selectedVoiceId) || VIETNAMESE_VOICES[0];
    const duration = Math.max(0.5, sub.endTime - sub.startTime);
    ttsService.speak(sub.vietnameseText, voice, dubbing, undefined, undefined, duration, sub.audioBlobUrl);
  };

  const handleTranslateSingleClick = async (sub: SubtitleSegment) => {
    const keys = getStoredApiKey();
    setTranslatingId(sub.id);
    try {
      const translated = await translateSingleSegmentWithGemini(sub.chineseText, translationTone, keys.geminiKey, geminiModel);
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

  const handleApplyPastedScript = () => {
    if (!pasteContent.trim()) return;
    const parsed = parseAnyTranscriptText(pasteContent);
    if (parsed.length > 0) {
      if (onImportSubtitles) {
        onImportSubtitles(parsed);
      }
      ttsService.prefetchSubtitles(parsed).catch(() => {});
      setIsPasteModalOpen(false);
      setPasteContent('');
      setFeedbackToast({ type: 'success', message: `Đã nạp thành công ${parsed.length} câu thoại từ kịch bản Gemini!` });
      setTimeout(() => setFeedbackToast(null), 3000);
    } else {
      setFeedbackToast({ type: 'error', message: 'Không thể nhận diện cấu trúc thời gian trong văn bản đã dán.' });
      setTimeout(() => setFeedbackToast(null), 3000);
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
                {isTranslatingAll ? 'Đang dịch...' : '🚀 Dịch Lại Toàn Bộ'}
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
            border: `1px solid ${feedbackToast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            {feedbackToast.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span>{feedbackToast.message}</span>
          </div>
        )}

        {/* Row 2: Header controls, Quick Tone Selectors & Mode switch */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Danh Sách Câu Thoại ({subtitles.length} câu)</span>
            </h3>

            {/* Smart Auto-follow Video Indicator Toggle */}
            <button
              onClick={() => setAutoFollowVideo(!autoFollowVideo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: autoFollowVideo ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: autoFollowVideo ? '#60a5fa' : 'var(--text-secondary)',
                border: `1px solid ${autoFollowVideo ? 'rgba(37, 99, 235, 0.4)' : 'transparent'}`,
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={autoFollowVideo ? 'Tự động cuộn theo video (Bật)' : 'Tự động cuộn theo video (Đang tắt - Bấm để bật)'}
            >
              <Compass size={11} />
              <span>{autoFollowVideo ? 'Bám Video: BẬT' : 'Bám Video: TẮT'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setViewMode('rollup')}
                style={{
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.68rem',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: viewMode === 'rollup' ? 'var(--brand-primary)' : 'transparent',
                  color: viewMode === 'rollup' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <ArrowUpCircle size={11} />
                <span>Cuộn Lên</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.68rem',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? 'var(--brand-primary)' : 'transparent',
                  color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <List size={11} />
                <span>Danh Sách</span>
              </button>
            </div>

            {/* Paste Gemini Script Button */}
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="btn-secondary"
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderColor: '#3b82f6',
                color: '#93c5fd',
                gap: '0.3rem'
              }}
              title="Dán kịch bản hoặc lời dịch từ Gemini / ChatGPT"
            >
              <ClipboardPaste size={12} />
              <span>📋 Dán Kịch Bản Gemini</span>
            </button>

            {/* Add Subtitle Button */}
            <button
              onClick={onAddSegment}
              className="btn-secondary"
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.72rem',
                borderColor: 'var(--border-subtle)',
                gap: '0.25rem'
              }}
            >
              <Plus size={12} />
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* Row 3: Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm phụ đề tiếng Trung, Pinyin hoặc Tiếng Việt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.65rem 0.35rem 1.85rem',
              fontSize: '0.75rem',
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Floating Re-sync Button when user scrolled away */}
      {!autoFollowVideo && activeIndex >= 0 && (
        <button
          onClick={() => {
            setAutoFollowVideo(true);
            if (scrollContainerRef.current && activeIndex >= 0) {
              const activeEl = scrollContainerRef.current.querySelector(`[data-sub-idx="${activeIndex}"]`) as HTMLElement;
              activeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '0.4rem 0.85rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <Compass size={13} />
          <span>📍 Cuộn về câu đang phát (#{activeIndex + 1})</span>
        </button>
      )}

      {/* Scrollable Subtitle Cards Workspace */}
      <div
        ref={scrollContainerRef}
        onScroll={handleUserScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem'
        }}
      >
        {filteredSubtitles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <Languages size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem' }}>Không tìm thấy câu phụ đề nào phù hợp.</p>
          </div>
        ) : (
          filteredSubtitles.map((sub, idx) => {
            const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
            const isSelected = sub.id === selectedSegmentId;
            const isTranslatingThis = translatingId === sub.id;

            return (
              <div
                key={sub.id}
                data-sub-idx={idx}
                onClick={() => onSelectSegment(sub.id, sub.startTime)}
                style={{
                  backgroundColor: isActive
                    ? 'rgba(37, 99, 235, 0.18)'
                    : isSelected
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: isActive
                    ? '1.5px solid #3b82f6'
                    : isSelected
                    ? '1px solid var(--border-active)'
                    : '1px solid var(--border-subtle)',
                  padding: '0.65rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 16px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {/* Card Top: Index, Time range, Duration & Action buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '0.35rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      fontWeight: 800,
                      color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: 'var(--radius-xs)'
                    }}>
                      #{idx + 1}
                    </span>

                    {/* Start Time input */}
                    <input
                      type="number"
                      step="0.1"
                      value={sub.startTime}
                      onChange={(e) => onUpdateSegment(sub.id, { startTime: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '44px',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '0.1rem 0.2rem',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        textAlign: 'center'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>-</span>
                    {/* End Time input */}
                    <input
                      type="number"
                      step="0.1"
                      value={sub.endTime}
                      onChange={(e) => onUpdateSegment(sub.id, { endTime: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '44px',
                        backgroundColor: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '0.1rem 0.2rem',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        textAlign: 'center'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      [{(sub.endTime - sub.startTime).toFixed(1)}s]
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewSegmentVoice(sub);
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', gap: '0.2rem' }}
                      title="Nghe thử câu này"
                    >
                      <Volume2 size={12} color="#38bdf8" />
                      <span>Nghe</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTranslateSingleClick(sub);
                      }}
                      disabled={isTranslatingThis}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', gap: '0.2rem' }}
                      title="Dịch lại câu này bằng AI"
                    >
                      {isTranslatingThis ? <Loader2 size={12} className="audio-bar" /> : <Sparkles size={12} color="#fbbf24" />}
                      <span>Dịch</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSegment(sub.id);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        padding: '0.2rem',
                        cursor: 'pointer'
                      }}
                      title="Xóa câu này"
                    >
                      <Trash2 size={13} color="#f87171" />
                    </button>
                  </div>
                </div>

                {/* Chinese Text Input */}
                {sub.chineseText && (
                  <div>
                    <input
                      type="text"
                      value={sub.chineseText}
                      onChange={(e) => onUpdateSegment(sub.id, { chineseText: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#facc15',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        outline: 'none',
                        padding: '0.1rem 0'
                      }}
                      placeholder="Lời thoại tiếng Trung gốc..."
                    />
                  </div>
                )}

                {/* Vietnamese Translation Input (Dubbing Text) */}
                <div>
                  <textarea
                    rows={2}
                    value={sub.vietnameseText}
                    onChange={(e) => onUpdateSegment(sub.id, { vietnameseText: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                      outline: 'none',
                      padding: '0.4rem 0.55rem',
                      resize: 'vertical'
                    }}
                    placeholder="Bản dịch tiếng Việt (lời lồng tiếng)..."
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paste Gemini Script Modal */}
      {isPasteModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '620px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardPaste size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  Dán Kịch Bản / Lời Thoại Từ Gemini hoặc ChatGPT
                </h3>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Bạn có thể sao chép và dán trực tiếp toàn bộ kết quả bóc băng / dịch từ <strong>Gemini</strong> hoặc <strong>ChatGPT</strong> vào đây. Hệ thống sẽ tự động tách từng câu thoại, nhân vật và mốc thời gian:
              </p>

              <textarea
                rows={10}
                placeholder={`Ví dụ:\nBố (00:00 - 00:02): Con nhìn con nhà người ta xem, rồi con tự nhìn lại mình đi.\nMẹ (00:03 - 00:07): Đúng thế đấy, cũng bỏ ra từng ấy tiền, ăn uống chẳng thua kém ai...\nCon (00:08 - 00:10): Bố, lần này đề thi thật sự rất khó...\nBố (00:11 - 00:12): Thế sao con nhà người ta lại thi tốt được như vậy hả?`}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  fontSize: '0.82rem',
                  color: '#ffffff',
                  outline: 'none',
                  fontFamily: 'monospace',
                  lineHeight: 1.45,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem'
            }}>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                Hủy
              </button>
              <button
                onClick={handleApplyPastedScript}
                className="btn-primary"
                style={{
                  backgroundColor: '#2563eb',
                  fontSize: '0.82rem',
                  padding: '0.5rem 1.25rem',
                  gap: '0.4rem'
                }}
              >
                <CheckCircle2 size={15} />
                <span>Áp Dụng Kịch Bản Này Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

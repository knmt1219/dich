import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Download,
  Languages,
  Palette,
  Volume2,
  Sparkles,
  Loader2,
  Key
} from 'lucide-react';

import type {
  SubtitleSegment,
  SubtitleStyle,
  DubbingSettings,
  TranslationTone,
  GeminiModel,
  SampleVideo
} from './types/video';

import { VIETNAMESE_VOICES } from './mockData/sampleVideos';
import {
  transcribeChineseVideo,
  batchTranslateWithGemini,
  getStoredApiKey
} from './services/aiService';
import { ttsService } from './services/ttsService';

import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { VideoUploader } from './components/VideoUploader';
import { VideoPlayer } from './components/VideoPlayer';
import { SubtitleEditor } from './components/SubtitleEditor';
import { SubtitleStylePanel } from './components/SubtitleStylePanel';
import { VoiceDubbingPanel } from './components/VoiceDubbingPanel';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HowItWorks } from './components/HowItWorks';
import { FeatureGrid } from './components/FeatureGrid';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  // Video State (Starts empty until user uploads or selects a video)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentVideoFile, setCurrentVideoFile] = useState<File | null>(null);

  // Subtitles & AI State (Starts empty until user clicks Translate)
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [translationTone, setTranslationTone] = useState<TranslationTone>('natural');
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-1.5-pro');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');

  // Subtitle Style Customization
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({
    fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
    fontSize: 26,
    primaryColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backgroundPadding: 10,
    borderRadius: 8,
    positionY: 82,
    displayMode: 'vi-only',
    bold: true,
    italic: false,
    shadow: true,
    enableKaraoke: true,
    highlightColor: '#fde047'
  });

  // Dubbing Settings
  const [dubbingSettings, setDubbingSettings] = useState<DubbingSettings>({
    selectedVoiceId: VIETNAMESE_VOICES[0].id,
    ttsEngine: 'cloud',
    autoSpeedSync: true,
    speechRate: 1.0,
    pitch: 1.0,
    originalVolume: 0.7,
    dubbingVolume: 1.0,
    enableAudioDucking: true,
    duckingLevel: 0.15
  });

  // UI Studio Active Tab ('subtitles' | 'voices' | 'styles')
  const [activeTab, setActiveTab] = useState<'subtitles' | 'voices' | 'styles'>('subtitles');

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);

  // Check API Key on mount
  useEffect(() => {
    const keys = getStoredApiKey();
    setHasApiKey(Boolean(keys.geminiKey || keys.openaiKey));
  }, []);

  const handleScrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToUploader = () => {
    uploaderRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Video Selected (Uploaded or Preset Chosen)
  const handleVideoSelected = async (file: File | null, url: string, sampleData?: SampleVideo) => {
    ttsService.stop();
    setVideoUrl(url);
    setCurrentTime(0);
    setCurrentVideoFile(file);
    setSubtitles([]); // Start with empty subtitles until user clicks translate

    // 1. If user doesn't have an API key, pop up API Key modal to enter key first
    const keys = getStoredApiKey();
    if (!keys.geminiKey && !keys.openaiKey) {
      setIsApiKeyModalOpen(true);
    }

    if (sampleData) {
      setVideoDuration(sampleData.duration);
      handleScrollToEditor();
      return;
    }

    // 2. Measure real duration of uploaded video file
    let realDuration = 30;
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = url;
      await new Promise<void>((resolve) => {
        tempVideo.onloadedmetadata = () => {
          realDuration = tempVideo.duration || 30;
          resolve();
        };
        tempVideo.onerror = () => resolve();
        setTimeout(resolve, 2500); // 2.5s safe timeout
      });
    } catch {
      realDuration = 30;
    }

    setVideoDuration(realDuration);
    handleScrollToEditor();
  };

  // Start AI Translation Process when user clicks the Translate button
  const handleStartTranslation = async (tone: TranslationTone = translationTone) => {
    if (!videoUrl) return;

    setIsProcessingAI(true);
    setProcessingProgress(15);
    setProcessingStatusText(`Đang phân tích và dịch thuật với ${geminiModel.toUpperCase()}...`);

    try {
      const keys = getStoredApiKey();
      const generatedSubs = await transcribeChineseVideo(
        currentVideoFile,
        videoDuration || 30,
        keys.geminiKey,
        geminiModel,
        tone,
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatusText(status);
        }
      );
      setSubtitles(generatedSubs);
      setActiveTab('subtitles');
    } catch (err) {
      console.error('Error translating video:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleUpdateSegment = (id: string, updated: Partial<SubtitleSegment>) => {
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updated } : sub))
    );
  };

  const handleDeleteSegment = (id: string) => {
    setSubtitles((prev) => prev.filter((sub) => sub.id !== id));
  };

  const handleAddSegment = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newStart = lastSub ? Math.round((lastSub.endTime + 0.3) * 10) / 10 : 0;
    const newEnd = Math.round((newStart + 3.5) * 10) / 10;

    const newSub: SubtitleSegment = {
      id: `custom-sub-${Date.now()}`,
      startTime: newStart,
      endTime: newEnd,
      chineseText: '请在此输入中文文本',
      pinyin: 'Qǐng zài cǐ shūrù zhōngwén wénběn',
      vietnameseText: 'Nhập câu dịch tiếng Việt tại đây',
      voiceGender: 'female'
    };

    setSubtitles((prev) => [...prev, newSub]);
    setSelectedSegmentId(newSub.id);
  };

  const handleBatchTranslate = async (tone: TranslationTone) => {
    setTranslationTone(tone);
    const keys = getStoredApiKey();
    const updatedSubs = await batchTranslateWithGemini(subtitles, tone, geminiModel, keys.geminiKey);
    setSubtitles(updatedSubs);
  };

  const handleApiKeySaved = () => {
    const keys = getStoredApiKey();
    setHasApiKey(Boolean(keys.geminiKey || keys.openaiKey));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Header */}
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onScrollToEditor={handleScrollToUploader}
        hasApiKey={hasApiKey}
      />

      {/* 2. Hero Banner */}
      <HeroBanner
        onStartUpload={handleScrollToUploader}
        onSelectPreset={handleScrollToUploader}
      />

      {/* 3. Section 1: Video Uploader & Sample Picker */}
      <section
        ref={uploaderRef}
        style={{
          padding: '2.5rem 0 3rem',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="container-custom" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="badge badge-brand" style={{ marginBottom: '0.5rem' }}>
              <Sparkles size={13} />
              <span>Bước 1: Tải Video Lên</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Tải Lên Video Tiếng Trung Cần Dịch & Lồng Tiếng
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              Hỗ trợ kéo thả video MP4, WebM từ Douyin, TikTok, Kuaishou hoặc dán trực tiếp link video.
            </p>
          </div>

          <VideoUploader onVideoSelected={handleVideoSelected} isProcessing={isProcessingAI} />
        </div>
      </section>

      {/* 4. KẺ NGANG PHÂN CÁCH RÕ RÀNG */}
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--border-active), transparent)'
      }} />

      {/* 5. Section 2: Studio Workspace */}
      <main ref={editorRef} style={{ flex: 1, padding: '2.5rem 0 3.5rem', backgroundColor: 'var(--bg-main)' }}>
        <div className="container-custom">
          {/* Section Heading Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div className="badge badge-brand" style={{ marginBottom: '0.35rem' }}>
                <Languages size={13} />
                <span>Bilingual Studio Workspace</span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Không Gian Dịch Phụ Đề & Lồng Tiếng Thời Gian Thực
              </h2>
            </div>

            {videoUrl && (
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleScrollToUploader}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                >
                  <UploadCloud size={15} />
                  <span>Chọn Video Khác Ở Trên</span>
                </button>

                {subtitles.length > 0 && (
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="btn-primary"
                    style={{
                      backgroundColor: '#10b981',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '0.85rem',
                      padding: '0.55rem 1.25rem'
                    }}
                  >
                    <Download size={16} />
                    <span>Xuất File / Tải Về</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Synchronized Equal-Height Split Workspace */}
          {!videoUrl ? (
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '2px dashed var(--border-active)',
              borderRadius: 'var(--radius-xl)',
              padding: '4.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 0 30px rgba(37, 99, 235, 0.25)'
              }}>
                <UploadCloud size={38} color="#60a5fa" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.45rem' }}>
                  Chưa Có Video Nào Được Tải Lên
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.55 }}>
                  Vui lòng tải lên video tiếng Trung của bạn (MP4 / WebM) hoặc dán link / chọn mẫu demo ở phần trên. AI sẽ tự động phân tích và tạo phụ đề lồng tiếng dành riêng cho video đó!
                </p>
              </div>
              <button
                onClick={handleScrollToUploader}
                className="btn-primary"
                style={{
                  backgroundColor: '#2563eb',
                  padding: '0.75rem 1.85rem',
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  gap: '0.5rem',
                  boxShadow: '0 4px 18px rgba(37, 99, 235, 0.45)',
                  cursor: 'pointer'
                }}
              >
                <UploadCloud size={17} />
                <span>⬆️ Tải Video Hoặc Chọn Mẫu Ngay</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '1.5rem',
              alignItems: 'stretch',
              height: '610px',
              maxHeight: '610px'
            }}>
              {/* Left Column: Video Player & Controls (Height 100%) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                gap: '0.75rem'
              }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <VideoPlayer
                    videoUrl={videoUrl}
                    subtitles={subtitles}
                    style={subtitleStyle}
                    dubbing={dubbingSettings}
                    currentTime={currentTime}
                    onTimeUpdate={setCurrentTime}
                    onDurationChange={setVideoDuration}
                    selectedSegmentId={selectedSegmentId}
                    onSelectSegment={setSelectedSegmentId}
                    onUpdateDubbing={(newDub) => setDubbingSettings(prev => ({ ...prev, ...newDub }))}
                  />
                </div>

                {/* Quick Info Bar */}
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      {subtitles.length > 0 ? `${subtitles.length} câu thoại song ngữ` : 'Chờ bấm nút dịch'}
                    </span>
                    <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                      {VIETNAMESE_VOICES.find(v => v.id === dubbingSettings.selectedVoiceId)?.name}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ⏱ Thời lượng: <strong>{videoDuration.toFixed(1)}s</strong>
                  </span>
                </div>
              </div>

              {/* Right Column: Dynamic State (Start Translation Box OR Full Editor) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
                gap: '0.65rem'
              }}>
                {subtitles.length === 0 ? (
                  /* Action Box: Ready to Translate */
                  <div style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '2.5rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.25rem',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    {isProcessingAI ? (
                      <div style={{ width: '100%', maxWidth: '380px' }}>
                        <Loader2 size={44} color="#3b82f6" className="audio-bar" style={{ margin: '0 auto 1rem' }} />
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                          {processingStatusText || 'AI đang phân tích & dịch thuật...'}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                          Đang xử lý lời thoại video và tạo giọng đọc lồng tiếng chuẩn xác...
                        </p>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${processingProgress}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(37, 99, 235, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          boxShadow: '0 0 25px rgba(37, 99, 235, 0.25)'
                        }}>
                          <Sparkles size={30} color="#60a5fa" />
                        </div>

                        <div>
                          <div className="badge badge-brand" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                            <span>⭐ Mô hình: {geminiModel.toUpperCase()}</span>
                          </div>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                            Video Đã Sẵn Sàng Để Dịch
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
                            Video dài <strong>{videoDuration.toFixed(1)}s</strong> đã được nạp thành công. Hãy chọn văn phong và bấm nút bên dưới để AI dịch và tạo lồng tiếng.
                          </p>
                        </div>

                        {/* Tone Selector */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {(['natural', 'cinematic', 'news', 'humorous'] as TranslationTone[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTranslationTone(t)}
                              className="btn-secondary"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                backgroundColor: translationTone === t ? 'rgba(37, 99, 235, 0.25)' : 'var(--bg-card)',
                                borderColor: translationTone === t ? '#3b82f6' : 'var(--border-subtle)',
                                color: translationTone === t ? '#60a5fa' : 'var(--text-secondary)'
                              }}
                            >
                              {t === 'natural' ? '🌿 Tự nhiên' : t === 'cinematic' ? '🎬 Điện ảnh' : t === 'news' ? '📰 Review' : '😄 Hài hước'}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', maxWidth: '340px' }}>
                          <button
                            onClick={() => handleStartTranslation(translationTone)}
                            className="btn-primary"
                            style={{
                              backgroundColor: '#2563eb',
                              padding: '0.85rem 1.5rem',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              gap: '0.5rem',
                              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.5)',
                              cursor: 'pointer'
                            }}
                          >
                            <Sparkles size={18} />
                            <span>🚀 Bắt Đầu Dịch Video Bằng AI</span>
                          </button>

                          <button
                            onClick={() => setIsApiKeyModalOpen(true)}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.45rem 0.85rem',
                              justifyContent: 'center'
                            }}
                          >
                            <Key size={13} />
                            <span>{hasApiKey ? 'Đổi Mô Hình AI / Key' : 'Cài Đặt API Key (Gemini 1.5 Pro)'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Full Subtitle / Dubbing / Style Workspace */
                  <>
                    {/* Tab Navigation Header */}
                    <div style={{
                      display: 'flex',
                      gap: '0.4rem',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '0.3rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      flexShrink: 0
                    }}>
                      <button
                        onClick={() => setActiveTab('subtitles')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '0.55rem 0.4rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: activeTab === 'subtitles' ? 'var(--brand-primary)' : 'transparent',
                          color: activeTab === 'subtitles' ? '#ffffff' : 'var(--text-secondary)',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Languages size={15} />
                        <span>Biên Tập Phụ Đề ({subtitles.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('voices')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '0.55rem 0.4rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: activeTab === 'voices' ? 'var(--brand-primary)' : 'transparent',
                          color: activeTab === 'voices' ? '#ffffff' : 'var(--text-secondary)',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Volume2 size={15} />
                        <span>Lồng Tiếng AI</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('styles')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '0.55rem 0.4rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: activeTab === 'styles' ? 'var(--brand-primary)' : 'transparent',
                          color: activeTab === 'styles' ? '#ffffff' : 'var(--text-secondary)',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Palette size={15} />
                        <span>Kiểu Phụ Đề</span>
                      </button>
                    </div>

                    {/* Tab Content Display */}
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      {activeTab === 'subtitles' && (
                        <SubtitleEditor
                          subtitles={subtitles}
                          currentTime={currentTime}
                          selectedSegmentId={selectedSegmentId}
                          dubbing={dubbingSettings}
                          translationTone={translationTone}
                          geminiModel={geminiModel}
                          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                          onSelectSegment={(id, time) => {
                            setSelectedSegmentId(id);
                            if (time !== undefined) setCurrentTime(time);
                          }}
                          onUpdateSegment={handleUpdateSegment}
                          onDeleteSegment={handleDeleteSegment}
                          onAddSegment={handleAddSegment}
                          onBatchTranslate={handleBatchTranslate}
                        />
                      )}

                      {activeTab === 'voices' && (
                        <VoiceDubbingPanel
                          dubbing={dubbingSettings}
                          onUpdateDubbing={(newSettings) => setDubbingSettings(prev => ({ ...prev, ...newSettings }))}
                        />
                      )}

                      {activeTab === 'styles' && (
                        <SubtitleStylePanel
                          style={subtitleStyle}
                          onUpdateStyle={(newStyle) => setSubtitleStyle(prev => ({ ...prev, ...newStyle }))}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 6. ĐƯỜNG KẺ NGANG KẾT THÚC KHU VỰC DỊCH */}
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--border-active), transparent)'
      }} />

      {/* 7. How it works 3-steps Section */}
      <HowItWorks />

      {/* 8. Features Grid Section */}
      <FeatureGrid />

      {/* 9. FAQ Section */}
      <FaqSection />

      {/* 10. Footer */}
      <Footer />

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoUrl={videoUrl}
        subtitles={subtitles}
        style={subtitleStyle}
        dubbing={dubbingSettings}
        videoDuration={videoDuration}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={handleApiKeySaved}
        geminiModel={geminiModel}
        onModelChange={setGeminiModel}
      />
    </div>
  );
};

export default App;

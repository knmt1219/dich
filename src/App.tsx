import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  UploadCloud,
  Palette,
  Volume2,
  Languages,
  Loader2
} from 'lucide-react';

import type {
  SubtitleSegment,
  SubtitleStyle,
  DubbingSettings,
  TranslationTone,
  GeminiModel,
  SampleVideo
} from './types/video';

import { SAMPLE_CHINESE_VIDEOS, VIETNAMESE_VOICES } from './mockData/sampleVideos';
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
  // Video State
  const [videoUrl, setVideoUrl] = useState<string | null>(SAMPLE_CHINESE_VIDEOS[0].videoUrl);
  const [videoDuration, setVideoDuration] = useState<number>(SAMPLE_CHINESE_VIDEOS[0].duration);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Subtitles & AI State
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(SAMPLE_CHINESE_VIDEOS[0].subtitles);
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

  // Dubbing Settings (Default to Cloud AI Voice Stream with Auto Speed Sync)
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

    if (sampleData) {
      setVideoDuration(sampleData.duration);
      setSubtitles(sampleData.subtitles);
      handleScrollToEditor();
      return;
    }

    setIsProcessingAI(true);
    handleScrollToEditor();

    // 1. Measure real duration of uploaded video file
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

    try {
      const keys = getStoredApiKey();
      const generatedSubs = await transcribeChineseVideo(
        file,
        realDuration,
        keys.geminiKey,
        geminiModel,
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatusText(status);
        }
      );
      setSubtitles(generatedSubs);
    } catch (err) {
      console.error('Error processing video:', err);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Sticky Header */}
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onScrollToEditor={handleScrollToEditor}
        hasApiKey={hasApiKey}
      />

      {/* 2. Hero Section */}
      <HeroBanner
        onStartUpload={handleScrollToUploader}
        onSelectPreset={handleScrollToUploader}
      />

      {/* 3. Section 1: Uploader & Sample Chinese Videos (Nằm ở TRÊN) */}
      <section ref={uploaderRef} style={{ padding: '3rem 0 2rem', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container-custom">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 1.75rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '0.4rem' }}>
              Tải Video Tiếng Trung Lên Hoặc Chọn Mẫu Để Bắt Đầu
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Hỗ trợ video MP4, Douyin, Kuaishou, vlog du lịch, ẩm thực và review phim ngắn.
            </p>
          </div>

          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <VideoUploader
              onVideoSelected={handleVideoSelected}
              isProcessing={isProcessingAI}
            />
          </div>
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

      {/* 5. Section 2: Studio Workspace (Phần Dịch & Lồng Tiếng Khớp Chiều Cao Chuẩn) */}
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

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleScrollToUploader}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
              >
                <UploadCloud size={15} />
                <span>Chọn Video Khác Ở Trên</span>
              </button>

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
            </div>
          </div>

          {/* AI Processing Overlay */}
          {isProcessingAI && (
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Loader2 size={36} color="#3b82f6" className="audio-bar" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                {processingStatusText || 'AI đang phân tích video tiếng Trung...'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '1rem' }}>
                Đang tự động nhận diện lời thoại Mandarin, tính toán timestamps và dịch sang tiếng Việt chuẩn ngữ cảnh.
              </p>
              <div style={{
                maxWidth: '420px',
                margin: '0 auto',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${processingProgress}%`,
                  height: '100%',
                  backgroundColor: 'var(--brand-primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Synchronized Equal-Height Split Workspace (Bound strictly to ~600px height) */}
          {videoUrl && (
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
                      {subtitles.length} câu thoại song ngữ
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

              {/* Right Column: Tabbed Subtitle / Dubbing / Style Workspace (Height 100%, Never Overflows) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
                gap: '0.65rem'
              }}>
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

                {/* Tab Content Display (Strictly filling remaining height) */}
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
                        if (time !== undefined) {
                          setCurrentTime(time);
                        }
                      }}
                      onUpdateSegment={handleUpdateSegment}
                      onDeleteSegment={handleDeleteSegment}
                      onAddSegment={handleAddSegment}
                      onBatchTranslate={handleBatchTranslate}
                    />
                  )}

                  {activeTab === 'voices' && (
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                      <VoiceDubbingPanel
                        dubbing={dubbingSettings}
                        onUpdateDubbing={(newDub) => setDubbingSettings(prev => ({ ...prev, ...newDub }))}
                      />
                    </div>
                  )}

                  {activeTab === 'styles' && (
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                      <SubtitleStylePanel
                        style={subtitleStyle}
                        onUpdateStyle={(newStyle) => setSubtitleStyle(prev => ({ ...prev, ...newStyle }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 6. ĐƯỜNG KẺ NGANG KẾT THÚC KHU VỰC DỊCH (Đường kẻ đỏ ranh giới) */}
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--border-active), transparent)'
      }} />

      {/* 7. How it works 3-steps Section (Nằm sạch sẽ ở dưới) */}
      <HowItWorks />

      {/* 8. Features Grid Section */}
      <FeatureGrid />

      {/* 9. FAQ Section */}
      <FaqSection />

      {/* 10. Footer */}
      <Footer />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoUrl={videoUrl}
        videoDuration={videoDuration}
        subtitles={subtitles}
        style={subtitleStyle}
        dubbing={dubbingSettings}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={() => {
          const keys = getStoredApiKey();
          setHasApiKey(Boolean(keys.geminiKey || keys.openaiKey));
        }}
        geminiModel={geminiModel}
        onModelChange={setGeminiModel}
      />
    </div>
  );
};

export default App;

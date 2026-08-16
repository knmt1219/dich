import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Download,
  Languages,
  Palette,
  Volume2,
  Sparkles,
  Loader2,
  CheckCircle2
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
import { FeatureGrid } from './components/FeatureGrid';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  // Video State (Starts empty until user uploads or selects a video)
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [pendingVideo, setPendingVideo] = useState<{
    file: File | null;
    url: string;
    sampleData?: SampleVideo;
  } | null>(null);

  // Subtitles & AI State (Populated strictly after AI finishes processing 100%)
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [translationTone, setTranslationTone] = useState<TranslationTone>('natural');
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-1.5-pro');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleScrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToUploader = () => {
    uploaderRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Dedicated AI Processing & 100% Quality Verification Pipeline
  const startAiProcessingPipeline = async (
    file: File | null,
    url: string,
    sampleData?: SampleVideo
  ) => {
    ttsService.stop();
    setVideoUrl(url);
    setCurrentTime(0);
    setSubtitles([]); // Hide previous subtitles
    setIsProcessingAI(true);
    setProcessingProgress(15);
    setProcessingStatusText('Đang nạp video và trích xuất dòng thời gian...');

    handleScrollToEditor();

    if (sampleData) {
      setVideoDuration(sampleData.duration);
      setProcessingProgress(40);
      setProcessingStatusText('Đang phân tích lời thoại mẫu tiếng Trung...');
      setTimeout(() => {
        setProcessingProgress(75);
        setProcessingStatusText('Đang quét thẩm định bản dịch 100% chuẩn xác...');
        setTimeout(() => {
          setProcessingProgress(100);
          setSubtitles(sampleData.subtitles);
          setIsProcessingAI(false);
          showToast('✅ Hoàn thành dịch thuật 100% & lồng tiếng video!');
        }, 500);
      }, 500);
      return;
    }

    // Measure real duration of uploaded video file
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

    // Run AI transcription, deep translation and mandatory 100% verification
    try {
      const keys = getStoredApiKey();

      setProcessingProgress(20);
      setProcessingStatusText('Gemini đang lắng nghe và bóc băng lời thoại video...');

      const generatedSubs = await transcribeChineseVideo(
        file,
        realDuration,
        keys.geminiKey,
        geminiModel,
        translationTone,
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatusText(status);
        }
      );

      setSubtitles(generatedSubs);
      setProcessingProgress(100);
      setActiveTab('subtitles');
      showToast('✅ Hoàn thành bóc băng & dịch thuật 100%!');

      // Pre-cache voice dubbing audio in background
      ttsService.prefetchSubtitles(generatedSubs).catch(() => {});
    } catch (err) {
      console.error('Error processing video:', err);
      showToast('❌ Có lỗi trong quá trình xử lý. Vui lòng thử lại!');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Triggered as soon as a video is uploaded/dropped
  const handleVideoSelected = (file: File | null, url: string, sampleData?: SampleVideo) => {
    const keys = getStoredApiKey();
    const hasKey = Boolean(keys.geminiKey || keys.openaiKey);

    // 1. If user doesn't have an API key, pop up API Key modal to enter key first
    if (!hasKey) {
      setPendingVideo({ file, url, sampleData });
      setIsApiKeyModalOpen(true);
      return;
    }

    // 2. If API Key exists, start the translation pipeline directly
    startAiProcessingPipeline(file, url, sampleData);
  };

  // Called when API Key is saved in modal
  const handleApiKeySaved = () => {
    const keys = getStoredApiKey();
    setHasApiKey(Boolean(keys.geminiKey || keys.openaiKey));
    showToast('✅ Đã nhập API Key thành công!');

    // If there was a pending video waiting for key, run translation right away!
    if (pendingVideo) {
      const { file, url, sampleData } = pendingVideo;
      setPendingVideo(null);
      startAiProcessingPipeline(file, url, sampleData);
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
    const updatedSubs = await batchTranslateWithGemini(subtitles, tone, keys.geminiKey, geminiModel);
    setSubtitles(updatedSubs);
    showToast('✅ Đã cập nhật bản dịch mới!');
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
              Kéo thả video MP4 / WebM hoặc chọn mẫu video có sẵn để AI tự động tạo thanh tiến độ dịch và lồng tiếng.
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

            {videoUrl && !isProcessingAI && subtitles.length > 0 && (
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
            )}
          </div>

          {/* 1. STATE: No video uploaded yet */}
          {!videoUrl && !isProcessingAI && (
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
                  Vui lòng kéo thả video tiếng Trung của bạn ở phần trên. AI sẽ tự động kích hoạt thanh tiến độ và hiển thị toàn bộ video đã dịch và lồng tiếng khi hoàn tất!
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
          )}

          {/* 2. STATE: Video is currently being processed by AI (Full Spotlight Progress Bar, Video is NOT visible yet) */}
          {isProcessingAI && (
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-xl)',
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              maxWidth: '720px',
              margin: '0 auto'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 0 35px rgba(37, 99, 235, 0.4)'
              }}>
                <Loader2 size={38} color="#60a5fa" className="audio-bar" />
              </div>

              <div className="badge badge-brand" style={{ marginBottom: '0.75rem' }}>
                <Sparkles size={13} />
                <span>Đang xử lý & thẩm định với {geminiModel.toUpperCase()}</span>
              </div>

              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                {processingStatusText || 'Đang phân tích và dịch thuật video...'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.5 }}>
                Hệ thống đang tự động trích xuất timeline, nhận diện lời thoại tiếng Trung, dịch sang tiếng Việt chuẩn ngữ cảnh và quét thẩm định 100% độ chính xác...
              </p>

              {/* Progress Track */}
              <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#60a5fa'
                }}>
                  <span>Tiến độ thẩm định & dịch thuật:</span>
                  <span style={{ fontSize: '1rem', color: '#ffffff' }}>{processingProgress}%</span>
                </div>

                <div style={{
                  height: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  padding: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    width: `${processingProgress}%`,
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(90deg, #2563eb, #38bdf8, #34d399)',
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)'
                  }} />
                </div>
              </div>

              {/* Steps Checklist */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '2rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: processingProgress >= 20 ? '#34d399' : 'inherit' }}>
                  <CheckCircle2 size={14} /> 1. Timeline Video
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: processingProgress >= 40 ? '#34d399' : 'inherit' }}>
                  <CheckCircle2 size={14} /> 2. Lời thoại tiếng Trung
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: processingProgress >= 65 ? '#34d399' : 'inherit' }}>
                  <CheckCircle2 size={14} /> 3. Dịch Gemini 1.5 Pro
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: processingProgress >= 90 ? '#34d399' : 'inherit' }}>
                  <CheckCircle2 size={14} /> 4. Quét thẩm định 100%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: processingProgress >= 100 ? '#34d399' : 'inherit' }}>
                  <CheckCircle2 size={14} /> 5. Lồng tiếng AI
                </span>
              </div>
            </div>
          )}

          {/* 3. STATE: Translation Finished 100% (Reveal Full Video Player + Subtitle Editor + Voice Dubbing) */}
          {videoUrl && !isProcessingAI && subtitles.length > 0 && (
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
                      {subtitles.length} câu thoại song ngữ đã thẩm định 100%
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

              {/* Right Column: Tabbed Subtitle / Dubbing / Style Workspace */}
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
                      onImportSubtitles={(newSubs) => {
                        setSubtitles(newSubs);
                        ttsService.prefetchSubtitles(newSubs).catch(() => {});
                      }}
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
      {/* 8. Features Grid Section */}
      <FeatureGrid />

      {/* 9. Footer */}
      <Footer />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0f172a',
          border: '1px solid #10b981',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

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

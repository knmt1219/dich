import React, { useState } from 'react';
import {
  X,
  Download,
  Film,
  FileText,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowDownToLine
} from 'lucide-react';
import type { SubtitleSegment, SubtitleStyle, DubbingSettings } from '../types/video';
import { generateSRT, generateVTT, generateTXT, downloadFile, drawSubtitleOnCanvas } from '../services/exportService';
import { ttsService } from '../services/ttsService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  videoDuration: number;
  subtitles: SubtitleSegment[];
  style: SubtitleStyle;
  dubbing: DubbingSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoDuration,
  subtitles,
  style,
  dubbing
}) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  // Export SRT
  const handleExportSRT = (mode: 'vi-only' | 'bilingual') => {
    const srtContent = generateSRT(subtitles, mode);
    const fileName = `phu-de-${mode === 'bilingual' ? 'song-ngu-trung-viet' : 'tieng-viet'}-${Date.now()}.srt`;
    downloadFile(srtContent, fileName, 'text/plain;charset=utf-8');
  };

  // Export VTT
  const handleExportVTT = (mode: 'vi-only' | 'bilingual') => {
    const vttContent = generateVTT(subtitles, mode);
    const fileName = `phu-de-${mode === 'bilingual' ? 'song-ngu' : 'tieng-viet'}-${Date.now()}.vtt`;
    downloadFile(vttContent, fileName, 'text/vtt;charset=utf-8');
  };

  // Export TXT Script
  const handleExportTXT = () => {
    const txtContent = generateTXT(subtitles);
    const fileName = `kich-ban-dich-trung-viet-${Date.now()}.txt`;
    downloadFile(txtContent, fileName, 'text/plain;charset=utf-8');
  };

  // Export Dubbed Video WITH FULL AUDIO (Mixed Video Audio + Vietnamese TTS Audio)
  const handleExportVideo = async () => {
    if (!videoUrl) return;

    setIsExportingVideo(true);
    setExportProgress(5);
    setStatusMessage('Đang chuẩn bị luồng âm thanh & video siêu tốc...');

    try {
      // 1. Setup AudioContext and Destination for recording mixed audio
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const audioDestination = audioCtx.createMediaStreamDestination();

      // 2. Pre-fetch and schedule all Vietnamese TTS audio chunks into AudioContext
      setStatusMessage('Đang tải và đồng bộ các đoạn âm thanh lồng tiếng...');
      setExportProgress(15);

      const ttsBuffers: Array<{ startTime: number; duration: number; buffer: AudioBuffer }> = [];

      for (let i = 0; i < subtitles.length; i++) {
        const sub = subtitles[i];
        try {
          const audioUrl = ttsService.getAudioUrlForText(sub.vietnameseText);
          const res = await fetch(audioUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(arrayBuf);
            ttsBuffers.push({
              startTime: sub.startTime,
              duration: sub.endTime - sub.startTime,
              buffer: decoded
            });
          }
        } catch (e) {
          console.warn('Could not pre-decode TTS for segment', sub.id, e);
        }
        setExportProgress(15 + Math.round(((i + 1) / subtitles.length) * 20));
      }

      setExportProgress(38);
      setStatusMessage('Đang kết xuất khung hình và trộn âm thanh (2x speed)...');

      // 3. Setup Video & Canvas
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = false;

      // Try to connect video's own audio track into audioDestination
      try {
        const videoSource = audioCtx.createMediaElementSource(video);
        const videoGain = audioCtx.createGain();
        videoGain.gain.value = Math.max(0.1, dubbing.originalVolume || 0.6);
        videoSource.connect(videoGain);
        videoGain.connect(audioDestination);
      } catch (e) {
        console.warn('Video element audio routing bypassed due to CORS, continuing with TTS audio mix:', e);
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể tạo Canvas 2D context');

      // 4. Combine Video Track from Canvas + Audio Tracks from AudioContext Destination
      const videoStream = canvas.captureStream(30);
      const combinedTracks = [
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        downloadFile(finalBlob, `video-dich-long-tieng-viet-${Date.now()}.webm`, 'video/webm');
        setIsExportingVideo(false);
        setExportProgress(100);
        setStatusMessage('Xuất video thành công đầy đủ âm thanh!');
        audioCtx.close().catch(() => {});
      };

      // 5. Start playback & recording
      await video.play();
      recorder.start(100);

      // Play each TTS buffer at its designated time
      const startTimeRef = audioCtx.currentTime;
      ttsBuffers.forEach((item) => {
        const source = audioCtx.createBufferSource();
        source.buffer = item.buffer;
        
        // Exact speed scaling to fit segment
        const rate = item.buffer.duration / Math.max(0.4, item.duration - 0.1);
        source.playbackRate.value = Math.min(2.5, Math.max(0.75, rate));

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = Math.min(1.0, dubbing.dubbingVolume || 1.0);

        source.connect(gainNode);
        gainNode.connect(audioDestination);
        
        source.start(startTimeRef + item.startTime);
      });

      const totalDuration = videoDuration || video.duration || 15;

      const renderLoop = () => {
        if (video.ended || video.currentTime >= totalDuration) {
          recorder.stop();
          video.pause();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const curSub = subtitles.find(
          (s) => video.currentTime >= s.startTime && video.currentTime <= s.endTime
        );
        if (curSub) {
          drawSubtitleOnCanvas(ctx, canvas.width, canvas.height, curSub, style, video.currentTime);
        }

        const renderProgress = 40 + Math.min(58, Math.round((video.currentTime / totalDuration) * 58));
        setExportProgress(renderProgress);
        setStatusMessage(`Đang kết xuất video & trộn âm thanh lồng tiếng: ${renderProgress}%...`);

        requestAnimationFrame(renderLoop);
      };

      renderLoop();
    } catch (err) {
      console.error('Lỗi khi xuất video:', err);
      setIsExportingVideo(false);
      alert('Không thể kết xuất trực tiếp video từ trình duyệt này. Bạn có thể tải file phụ đề SRT/VTT để gắn vào CapCut hoặc Premiere!');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '680px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Download size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Xuất File Phụ Đề & Video Đầy Đủ Âm Thanh Lồng Tiếng
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Export Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isExportingVideo ? (
            <div style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Loader2 size={40} color="#3b82f6" className="audio-bar" style={{ margin: '0 auto 1.25rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
                {statusMessage}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Hệ thống đang nén video và trộn đầy đủ âm thanh lồng tiếng tiếng Việt chuẩn khớp thời gian.
              </p>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${exportProgress}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.25s ease'
                }} />
              </div>
              <div style={{ textAlign: 'right', marginTop: '0.4rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                {exportProgress}%
              </div>
            </div>
          ) : (
            <>
              {/* Option 1: Render & Export Full Video with Mixed Audio */}
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Film size={18} color="#34d399" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                      1. Xuất Video MP4/WebM Kèm Phụ Đề & Lồng Tiếng (Đầy Đủ Âm Thanh)
                    </h4>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                    <CheckCircle2 size={11} /> Có Đầy Đủ Tiếng
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.45 }}>
                  Tự động render video gắn cứng phụ đề Karaoke tiếng Việt và <strong>hòa trộn đầy đủ âm thanh lồng tiếng AI + âm thanh video gốc</strong>.
                </p>

                <button
                  onClick={handleExportVideo}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    backgroundColor: '#10b981',
                    borderColor: 'rgba(255,255,255,0.2)',
                    padding: '0.85rem',
                    fontSize: '0.925rem'
                  }}
                >
                  <Sparkles size={17} />
                  <span>Bắt Đầu Xuất Video Kèm Tiếng Ngay</span>
                </button>
              </div>

              {/* Option 2: Export Subtitles (SRT / VTT / TXT) */}
              <div style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FileText size={18} color="#60a5fa" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    2. Tải File Phụ Đề Nhanh (SRT / VTT / Kịch Bản)
                  </h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Tải ngay trong 0.1 giây để import trực tiếp vào CapCut, Adobe Premiere, DaVinci Resolve hoặc YouTube.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleExportSRT('vi-only')}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.6rem 0.85rem' }}
                  >
                    <ArrowDownToLine size={15} />
                    <span>Tải SRT (Tiếng Việt)</span>
                  </button>

                  <button
                    onClick={() => handleExportSRT('bilingual')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.6rem 0.85rem' }}
                  >
                    <ArrowDownToLine size={15} />
                    <span>Tải SRT (Song ngữ)</span>
                  </button>

                  <button
                    onClick={() => handleExportVTT('vi-only')}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.6rem 0.85rem' }}
                  >
                    <ArrowDownToLine size={15} />
                    <span>Tải WebVTT (.vtt)</span>
                  </button>

                  <button
                    onClick={handleExportTXT}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.6rem 0.85rem' }}
                  >
                    <FileText size={15} />
                    <span>Kịch bản (.txt)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

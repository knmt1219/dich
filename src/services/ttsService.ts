import type { VoiceConfig, DubbingSettings, SubtitleSegment } from '../types/video';
import { VIETNAMESE_VOICES } from '../mockData/sampleVideos';

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private audioDurationCache = new Map<string, number>();
  private audioBlobCache = new Map<string, string>();
  private isAudioUnlocked = false;
  private synthHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.synth?.getVoices();
        };
      }
    }
  }

  /**
   * Unlock audio playback permissions across mobile and desktop browsers
   */
  public unlockAudio(): void {
    if (this.isAudioUnlocked) return;
    this.isAudioUnlocked = true;

    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
        // Prime the speech engine with an empty utterance
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        this.synth.speak(silent);
      } catch {}
    }

    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0.01;
      silentAudio.play().catch(() => {});
    } catch {}
  }

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const all = this.synth.getVoices();
    return all.filter(v => 
      v.lang.toLowerCase().startsWith('vi') || 
      v.lang.toLowerCase().includes('viet') || 
      v.name.toLowerCase().includes('vietnam') ||
      v.name.toLowerCase().includes('hoaimy') ||
      v.name.toLowerCase().includes('namminh')
    );
  }

  /**
   * Calculate precise dynamic speech rate based on word count and video segment duration
   */
  public calculateDynamicRate(text: string, durationSeconds: number, baseRate = 1.0): number {
    if (!durationSeconds || durationSeconds <= 0) return baseRate;

    const cleanText = text.trim();
    if (this.audioDurationCache.has(cleanText)) {
      const realDur = this.audioDurationCache.get(cleanText)!;
      const targetSecs = Math.max(0.4, durationSeconds - 0.1);
      const exactRate = (realDur / targetSecs) * baseRate;
      return Math.min(2.2, Math.max(0.8, Math.round(exactRate * 100) / 100));
    }

    const words = cleanText.split(/\s+/).filter(Boolean).length;
    if (words === 0) return baseRate;

    // Standard Vietnamese speech: ~3.5 words per second
    const estimatedNormalSeconds = Math.max(0.5, (words / 3.5) + 0.15);
    const targetSeconds = Math.max(0.4, durationSeconds - 0.1);

    const requiredRate = (estimatedNormalSeconds / targetSeconds) * baseRate;
    return Math.min(2.2, Math.max(0.8, Math.round(requiredRate * 100) / 100));
  }

  /**
   * Get direct high-fidelity Vietnamese Neural Audio URL via proxy
   */
  public getAudioUrlForText(text: string): string {
    const cleanText = text.replace(/^[^:：]+[:：]\s*/, '').trim().slice(0, 200);
    if (!cleanText) return '';
    return `/api/tts?text=${encodeURIComponent(cleanText)}`;
  }

  /**
   * Actively verify and pre-load 100% of dubbing audio into memory with retry
   */
  public async verifyAndPreloadAllDubbing(
    subtitles: SubtitleSegment[],
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    const total = subtitles.length;
    if (total === 0) return true;

    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const seg = subtitles[i];
      const cleanText = seg.vietnameseText.replace(/^[^:：]+[:：]\s*/, '').trim();
      onProgress?.(i + 1, total);

      if (!cleanText) continue;

      if (!this.audioBlobCache.has(cleanText)) {
        const isMale = seg.voiceGender === 'male' || /^(\s*[-*•]?\s*)(bố|nam|anh|ông|con trai|chú|bác trai)\s*[:：]/i.test(seg.vietnameseText);
        const voiceParam = isMale ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural';

        // Try up to 2 times
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const safeText = cleanText.slice(0, 300);
            const url = `/api/edge-tts?text=${encodeURIComponent(safeText)}&voice=${voiceParam}`;
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              if (blob.size > 200) {
                const blobUrl = URL.createObjectURL(blob);
                this.audioBlobCache.set(cleanText, blobUrl);
                successCount++;
                break;
              }
            }
          } catch {}
          // Small delay before retry
          if (attempt === 0) await new Promise(r => setTimeout(r, 200));
        }
      } else {
        successCount++;
      }
    }

    return successCount > 0;
  }

  /**
   * Pre-cache audio blobs for all subtitles with chunked parallel fetching
   */
  public async prefetchSubtitles(subtitles: SubtitleSegment[]): Promise<void> {
    const segments = subtitles.filter(s => {
      const t = s.vietnameseText.replace(/^[^:：]+[:：]\s*/, '').trim();
      return t.length > 0 && !this.audioBlobCache.has(t);
    });

    const chunkSize = 3;
    for (let i = 0; i < segments.length; i += chunkSize) {
      const chunk = segments.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (seg) => {
          try {
            const cleanText = seg.vietnameseText.replace(/^[^:：]+[:：]\s*/, '').trim();
            const isMale = seg.voiceGender === 'male' || /^(\s*[-*•]?\s*)(bố|nam|anh|ông|con trai|chú|bác trai)\s*[:：]/i.test(seg.vietnameseText);
            const voiceParam = isMale ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural';
            const safeText = cleanText.slice(0, 300);
            const url = `/api/edge-tts?text=${encodeURIComponent(safeText)}&voice=${voiceParam}`;
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              const blobUrl = URL.createObjectURL(blob);
              this.audioBlobCache.set(cleanText, blobUrl);
            }
          } catch {}
        })
      );
    }
  }

  /**
   * Speak Vietnamese text with High-Fidelity Hybrid Pipeline
   */
  public speak(
    text: string,
    voiceConfig: VoiceConfig,
    settings: DubbingSettings,
    onStart?: () => void,
    onEnd?: () => void,
    segmentDuration?: number,
    directBlobUrl?: string
  ): void {
    // Strip speaker prefixes like "Bố: ", "Mẹ: ", "Con: " so TTS speaks pure Vietnamese dialogue
    const cleanText = text.replace(/^[^:：]+[:：]\s*/, '').trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    this.stop();
    this.unlockAudio();

    // Calculate dynamic speed
    let initialRate = settings.speechRate || 1.0;
    if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
      initialRate = this.calculateDynamicRate(cleanText, segmentDuration, initialRate);
    }

    // 1. Check direct blob url or cached blob (0ms latency playback)
    const cachedBlobUrl = directBlobUrl || this.audioBlobCache.get(cleanText);
    if (cachedBlobUrl) {
      this.playAudioUrl(cachedBlobUrl, cleanText, initialRate, settings, voiceConfig, onStart, onEnd, segmentDuration);
      return;
    }

    // 2. Play via /api/edge-tts proxy directly (Native Microsoft Neural MP3 stream)
    const safeText = cleanText.slice(0, 300);
    const voiceParam = voiceConfig.gender === 'male' ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural';
    const proxyUrl = `/api/edge-tts?text=${encodeURIComponent(safeText)}&voice=${voiceParam}`;
    this.playAudioUrl(proxyUrl, cleanText, initialRate, settings, voiceConfig, onStart, onEnd, segmentDuration);
  }

  private playAudioUrl(
    url: string,
    cleanText: string,
    initialRate: number,
    settings: DubbingSettings,
    voiceConfig: VoiceConfig,
    onStart?: () => void,
    onEnd?: () => void,
    segmentDuration?: number
  ): void {
    try {
      const audio = new Audio();
      this.currentAudio = audio;
      audio.preload = 'auto';
      audio.volume = Math.min(1.0, Math.max(0.1, settings.dubbingVolume || 1.0));
      audio.playbackRate = Math.min(2.2, Math.max(0.8, initialRate));

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          this.audioDurationCache.set(cleanText, audio.duration);
          if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
            const targetSeconds = Math.max(0.4, segmentDuration - 0.1);
            const exactRate = (audio.duration / targetSeconds) * (settings.speechRate || 1.0);
            audio.playbackRate = Math.min(2.2, Math.max(0.8, Math.round(exactRate * 100) / 100));
          }
        }
      };

      audio.onplay = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      audio.onended = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        onEnd?.();
      };

      audio.onerror = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
      };

      audio.src = url;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
        });
      }
    } catch {
      this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
    }
  }

  /**
   * Web Speech API Native Vietnamese Engine
   */
  public speakWebSpeech(
    text: string,
    voiceConfig: VoiceConfig,
    settings: DubbingSettings,
    onStart?: () => void,
    onEnd?: () => void,
    segmentDuration?: number
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'vi-VN';

          let effectiveRate = settings.speechRate || 1.0;
          if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
            effectiveRate = this.calculateDynamicRate(text, segmentDuration, effectiveRate);
          }

          let basePitch = settings.pitch || 1.0;
          if (voiceConfig.id === 'vi-story-male' || voiceConfig.gender === 'male') {
            basePitch = 0.92;
          } else if (voiceConfig.gender === 'female') {
            basePitch = 1.08;
          }

          utterance.rate = Math.min(2.0, Math.max(0.8, effectiveRate));
          utterance.pitch = Math.min(1.3, Math.max(0.8, basePitch));
          utterance.volume = Math.min(1.0, Math.max(0.1, settings.dubbingVolume || 1.0));

          // Look for Vietnamese system voices
          const viVoices = this.getAvailableSystemVoices();
          if (viVoices.length > 0) {
            const matched = viVoices.find(v =>
              voiceConfig.gender === 'female'
                ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('nữ') || v.name.toLowerCase().includes('hoaimy') || v.name.toLowerCase().includes('mai') || v.name.toLowerCase().includes('linh')
                : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('namminh') || v.name.toLowerCase().includes('minh')
            ) || viVoices[0];
            if (matched) utterance.voice = matched;
          }

          // Chrome SpeechSynthesis Heartbeat Watchdog
          if (this.synthHeartbeatTimer) clearInterval(this.synthHeartbeatTimer);
          this.synthHeartbeatTimer = setInterval(() => {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.resume();
            } else {
              if (this.synthHeartbeatTimer) {
                clearInterval(this.synthHeartbeatTimer);
                this.synthHeartbeatTimer = null;
              }
            }
          }, 250);

          utterance.onstart = () => {
            this.isSpeaking = true;
            onStart?.();
          };

          utterance.onend = () => {
            this.isSpeaking = false;
            if (this.synthHeartbeatTimer) {
              clearInterval(this.synthHeartbeatTimer);
              this.synthHeartbeatTimer = null;
            }
            onEnd?.();
          };

          utterance.onerror = () => {
            this.isSpeaking = false;
            if (this.synthHeartbeatTimer) {
              clearInterval(this.synthHeartbeatTimer);
              this.synthHeartbeatTimer = null;
            }
            onEnd?.();
          };

          window.speechSynthesis.speak(utterance);
        } catch {
          this.isSpeaking = false;
          onEnd?.();
        }
      }, 30);
    } catch {
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  /**
   * Stop any playing audio immediately
   */
  public stop(): void {
    if (this.synthHeartbeatTimer) {
      clearInterval(this.synthHeartbeatTimer);
      this.synthHeartbeatTimer = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch (e) {
        console.warn('Error pausing audio:', e);
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Error canceling synth:', e);
      }
    }

    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public previewVoice(voiceId: string, settings: DubbingSettings): void {
    const voice = VIETNAMESE_VOICES.find(v => v.id === voiceId) || VIETNAMESE_VOICES[0];
    const previewTexts: Record<string, string> = {
      'vi-cloud-female': 'Xin chào các bạn! Tôi là Mai Hương, giọng đọc Hà Nội tự nhiên, tự động căn khớp tốc độ hoàn hảo theo video.',
      'vi-cloud-male': 'Chào anh em! Tôi là Mạnh Cường, giọng đọc nam Hà Nội trầm ấm chuyên dành cho review công nghệ và vlog.',
      'vi-central-female-1': 'Dạ xin chào mọi người, mình là Ánh Nguyệt, giọng đọc miền Trung êm dịu, ngọt ngào cho video du lịch và phong cảnh.',
      'vi-south-female-1': 'Chào cả nhà nghen! Mình là Thảo Nhi, giọng đọc miền Nam tươi vui, lí lắc cho video ẩm thực và đời sống Douyin.',
      'vi-south-male-1': 'Bảo Long xin chào mọi người! Giọng đọc miền Nam năng động, cuốn hút cho phim ngắn và kịch tính.',
      'vi-story-male': 'Thanh Tùng xin kính chào các bạn! Đây là giọng đọc điện ảnh hào hùng, truyền cảm chuyên biệt cho tóm tắt phim và truyện kiếm hiệp.',
      'vi-youth-female': 'Hế lô các bạn ơi! Mình là Minh Thư, giọng đọc Douyin Gen Z siêu năng động, bắt trend cực cháy luôn nha!'
    };

    const text = previewTexts[voice.id] || 'Xin chào bạn, đây là giọng đọc AI tiếng Việt chuẩn tự nhiên.';
    this.speak(text, voice, settings);
  }
}

export const ttsService = new TTSService();

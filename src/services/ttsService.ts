import type { VoiceConfig, DubbingSettings, SubtitleSegment } from '../types/video';
import { VIETNAMESE_VOICES } from '../mockData/sampleVideos';

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private audioDurationCache = new Map<string, number>();
  private audioBlobCache = new Map<string, string>();
  private systemVoices: SpeechSynthesisVoice[] = [];
  private isAudioUnlocked = false;
  private synthHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.loadSystemVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadSystemVoices();
        }
      }
    }
  }

  private loadSystemVoices(): void {
    if (this.synth) {
      this.systemVoices = this.synth.getVoices();
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
      } catch {}
    }

    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.volume = 0.01;
      silentAudio.play().catch(() => {});
    } catch {}
  }

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (this.systemVoices.length === 0 && this.synth) {
      this.systemVoices = this.synth.getVoices();
    }
    return this.systemVoices.filter(v => 
      v.lang.toLowerCase().startsWith('vi') || 
      v.lang.toLowerCase().includes('viet') || 
      v.name.toLowerCase().includes('vietnam')
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
      return Math.min(2.5, Math.max(0.75, Math.round(exactRate * 100) / 100));
    }

    const words = cleanText.split(/\s+/).filter(Boolean).length;
    if (words === 0) return baseRate;

    // Standard Vietnamese speech: ~3.5 words per second
    const estimatedNormalSeconds = Math.max(0.5, (words / 3.5) + 0.15);
    const targetSeconds = Math.max(0.4, durationSeconds - 0.1);

    const requiredRate = (estimatedNormalSeconds / targetSeconds) * baseRate;
    return Math.min(2.5, Math.max(0.8, Math.round(requiredRate * 100) / 100));
  }

  /**
   * Get audio URL for Vietnamese text
   */
  public getAudioUrlForText(text: string): string {
    const cleanText = text.trim().slice(0, 200);
    if (!cleanText) return '';
    return `/api/tts?text=${encodeURIComponent(cleanText)}`;
  }

  /**
   * Pre-cache audio blobs for all subtitles with chunked parallel fetching
   */
  public async prefetchSubtitles(subtitles: SubtitleSegment[]): Promise<void> {
    const texts = subtitles
      .map(s => s.vietnameseText.replace(/^[^:：]+[:：]\s*/, '').trim())
      .filter(t => t.length > 0 && !this.audioBlobCache.has(t));

    const chunkSize = 4;
    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (text) => {
          try {
            const safeText = text.slice(0, 200);
            const url = `/api/tts?text=${encodeURIComponent(safeText)}`;
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              const blobUrl = URL.createObjectURL(blob);
              this.audioBlobCache.set(text, blobUrl);
            }
          } catch {}
        })
      );
    }
  }

  /**
   * Speak Vietnamese text with Instant Fallback Pipeline
   */
  public speak(
    text: string,
    voiceConfig: VoiceConfig,
    settings: DubbingSettings,
    onStart?: () => void,
    onEnd?: () => void,
    segmentDuration?: number
  ): void {
    // Strip speaker prefixes like "Bố: " for natural voice dubbing
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

    // Explicit system engine chosen
    if (settings.ttsEngine === 'system') {
      this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
      return;
    }

    // Check pre-cached audio blob
    const cachedBlobUrl = this.audioBlobCache.get(cleanText);
    const encoded = encodeURIComponent(cleanText.slice(0, 200));
    const candidateUrls: string[] = [];
    if (cachedBlobUrl) candidateUrls.push(cachedBlobUrl);
    candidateUrls.push(
      `/api/tts?text=${encoded}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=dict-chrome-ex&q=${encoded}`
    );

    let candidateIdx = 0;
    let hasStarted = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const tryNext = () => {
      if (hasStarted) return;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      if (candidateIdx >= candidateUrls.length) {
        // Fallback immediately to Web Speech API
        this.currentAudio = null;
        this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
        return;
      }

      const currentUrl = candidateUrls[candidateIdx];
      candidateIdx++;

      try {
        const audio = new Audio();
        this.currentAudio = audio;
        audio.preload = 'auto';
        audio.volume = Math.min(1.0, Math.max(0.05, settings.dubbingVolume));
        audio.playbackRate = Math.min(2.5, Math.max(0.75, initialRate));

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
            this.audioDurationCache.set(cleanText, audio.duration);
            if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
              const targetSeconds = Math.max(0.4, segmentDuration - 0.1);
              const exactRate = (audio.duration / targetSeconds) * (settings.speechRate || 1.0);
              audio.playbackRate = Math.min(2.5, Math.max(0.75, Math.round(exactRate * 100) / 100));
            }
          }
        };

        audio.onplay = () => {
          hasStarted = true;
          this.isSpeaking = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          onStart?.();
        };

        audio.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          onEnd?.();
        };

        audio.onerror = () => {
          if (!hasStarted) {
            tryNext();
          } else {
            this.isSpeaking = false;
            this.currentAudio = null;
            onEnd?.();
          }
        };

        audio.src = currentUrl;
        
        // Fast 500ms fallback timer to ensure voice is never delayed
        fallbackTimer = setTimeout(() => {
          if (!hasStarted) {
            tryNext();
          }
        }, 500);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (!hasStarted) {
              tryNext();
            }
          });
        }
      } catch {
        tryNext();
      }
    };

    tryNext();
  }

  /**
   * Web Speech API fallback with guaranteed speech and Chrome heartbeat
   */
  private speakWebSpeech(
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

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';

      let effectiveRate = settings.speechRate || 1.0;
      if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
        effectiveRate = this.calculateDynamicRate(text, segmentDuration, effectiveRate);
      }

      let basePitch = settings.pitch || 1.0;
      if (voiceConfig.id === 'vi-story-male') {
        basePitch = 0.88;
      } else if (voiceConfig.id === 'vi-youth-female') {
        basePitch = 1.15;
      }

      utterance.rate = Math.min(2.0, Math.max(0.75, effectiveRate));
      utterance.pitch = Math.min(1.3, Math.max(0.8, basePitch));
      utterance.volume = Math.min(1.0, Math.max(0.1, settings.dubbingVolume || 1.0));

      const viVoices = this.getAvailableSystemVoices();
      if (viVoices.length > 0) {
        const matched = viVoices.find(v =>
          voiceConfig.gender === 'female'
            ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('nữ') || v.name.toLowerCase().includes('hoaimy') || v.name.toLowerCase().includes('mai') || v.name.toLowerCase().includes('linh')
            : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('namminh') || v.name.toLowerCase().includes('minh')
        ) || viVoices[0];
        if (matched) utterance.voice = matched;
      }

      // Chrome SpeechSynthesis Heartbeat Fix
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

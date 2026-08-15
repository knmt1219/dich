import type { VoiceConfig, DubbingSettings } from '../types/video';
import { VIETNAMESE_VOICES } from '../mockData/sampleVideos';

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private audioCache = new Map<string, string>();
  private audioDurationCache = new Map<string, number>();
  private systemVoices: SpeechSynthesisVoice[] = [];

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

  public getAvailableSystemVoices(): SpeechSynthesisVoice[] {
    if (this.systemVoices.length === 0 && this.synth) {
      this.systemVoices = this.synth.getVoices();
    }
    return this.systemVoices.filter(v => v.lang.startsWith('vi') || v.lang.includes('VI') || v.lang.includes('vi_VN'));
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
    const cleanText = text.trim();
    if (!cleanText) return '';

    if (this.audioCache.has(cleanText)) {
      return this.audioCache.get(cleanText)!;
    }

    const proxyUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
    this.audioCache.set(cleanText, proxyUrl);
    return proxyUrl;
  }

  /**
   * Speak Vietnamese text with Multi-Tier Fallback (Edge Proxy -> Direct Stream -> Web Speech API)
   */
  public speak(
    text: string,
    voiceConfig: VoiceConfig,
    settings: DubbingSettings,
    onStart?: () => void,
    onEnd?: () => void,
    segmentDuration?: number
  ): void {
    const cleanText = text.trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    this.stop();

    // Initial estimation rate
    let initialRate = settings.speechRate || 1.0;
    if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
      initialRate = this.calculateDynamicRate(cleanText, segmentDuration, initialRate);
    }

    // Force Web Speech API if user selected system engine
    if (settings.ttsEngine === 'system') {
      this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
      return;
    }

    // Strategy 1: Edge Audio Proxy (/api/tts via Cloudflare Functions & Vite Dev)
    const audioUrl = this.getAudioUrlForText(cleanText);
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    audio.volume = Math.min(1.0, Math.max(0.05, settings.dubbingVolume));
    audio.playbackRate = initialRate;

    const applyPreciseSpeed = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        this.audioDurationCache.set(cleanText, audio.duration);
        if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
          const targetSeconds = Math.max(0.4, segmentDuration - 0.1);
          const exactRate = (audio.duration / targetSeconds) * (settings.speechRate || 1.0);
          audio.playbackRate = Math.min(2.5, Math.max(0.75, Math.round(exactRate * 100) / 100));
        }
      }
    };

    audio.onloadedmetadata = applyPreciseSpeed;
    if (audio.readyState >= 1) {
      applyPreciseSpeed();
    }

    let started = false;

    audio.onplay = () => {
      started = true;
      this.isSpeaking = true;
      onStart?.();
    };

    audio.onended = () => {
      this.isSpeaking = false;
      this.currentAudio = null;
      onEnd?.();
    };

    audio.onerror = () => {
      // Fallback Strategy 2: Web Speech API (100% reliable on all browsers / Cloudflare Pages)
      this.currentAudio = null;
      this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio stream error, falling back to Web Speech API:', err);
        if (!started) {
          this.currentAudio = null;
          this.speakWebSpeech(cleanText, voiceConfig, settings, onStart, onEnd, segmentDuration);
        }
      });
    }
  }

  /**
   * Web Speech API fallback with duration scaling and voice styling
   */
  private speakWebSpeech(
    text: string,
    voiceConfig: VoiceConfig,
    settings: DubbingSettings,
    onStart?: () => void,
    onEnd?: () => void,
    segmentDuration?: number
  ): void {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    try {
      this.synth.cancel();
      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';

      let effectiveRate = settings.speechRate || 1.0;
      if (settings.autoSpeedSync && segmentDuration && segmentDuration > 0) {
        effectiveRate = this.calculateDynamicRate(text, segmentDuration, effectiveRate);
      }

      // Voice pitch customization
      let basePitch = settings.pitch || 1.0;
      if (voiceConfig.id === 'vi-story-male') {
        basePitch = 0.9; // deeper dramatic pitch
      } else if (voiceConfig.id === 'vi-youth-female') {
        basePitch = 1.15; // brighter Gen Z pitch
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

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      this.synth.speak(utterance);
    } catch {
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  /**
   * Stop any playing audio immediately
   */
  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.warn('Error pausing audio:', e);
      }
      this.currentAudio = null;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
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

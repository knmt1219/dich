export interface SubtitleSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  chineseText: string;
  pinyin?: string;
  vietnameseText: string;
  isEditing?: boolean;
  voiceGender?: 'female' | 'male';
  audioBlobUrl?: string; // pre-rendered or cached TTS audio
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number; // in px
  primaryColor: string; // hex
  strokeColor: string; // hex
  strokeWidth: number; // in px
  backgroundColor: string; // rgba
  backgroundPadding: number; // px
  borderRadius: number; // px
  positionY: number; // percentage from top, 0-100 (default 85%)
  displayMode: 'vi-only' | 'bilingual' | 'zh-only';
  bold: boolean;
  italic: boolean;
  shadow: boolean;
  enableKaraoke: boolean; // Word-by-word active highlight
  highlightColor: string; // Color for spoken words
}

export type TranslationTone = 'natural' | 'cinematic' | 'news' | 'humorous';

export type GeminiModel = 'gemini-1.5-flash' | 'gemini-2.5-flash' | 'gemini-1.5-pro' | 'gemini-2.5-pro' | 'gemini-2.0-flash-exp';

export interface VoiceConfig {
  id: string;
  name: string;
  region: 'north' | 'central' | 'south' | 'special';
  gender: 'female' | 'male';
  description: string;
  engine: 'cloud' | 'system';
  avatarUrl?: string;
  langCode: string;
}

export interface DubbingSettings {
  selectedVoiceId: string;
  ttsEngine: 'cloud' | 'system' | 'auto';
  autoSpeedSync: boolean; // Automatically sync speech speed with video segment duration
  speechRate: number; // base rate: 0.8 - 1.5
  pitch: number; // 0.8 - 1.2
  originalVolume: number; // 0.0 - 1.0 (video volume)
  dubbingVolume: number; // 0.0 - 1.5 (TTS volume)
  enableAudioDucking: boolean;
  duckingLevel: number; // 0.05 - 0.5
}

export interface SampleVideo {
  id: string;
  title: string;
  category: string;
  duration: number;
  thumbnail: string;
  videoUrl: string;
  description: string;
  subtitles: SubtitleSegment[];
}

export interface ProjectState {
  videoFile: File | null;
  videoUrl: string | null;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  subtitles: SubtitleSegment[];
  selectedSegmentId: string | null;
  style: SubtitleStyle;
  dubbing: DubbingSettings;
  translationTone: TranslationTone;
  geminiModel: GeminiModel;
  isProcessingAI: boolean;
  processingProgress: number;
  processingStatusText: string;
}

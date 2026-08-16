import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
"""
Data Models for Chinese-to-Vietnamese Video Translation & AI Dubbing Pipeline
"""

import json
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Literal, Dict, Any

VoiceGender = Literal['female', 'male']

@dataclass
class SubtitleSegment:
    id: str
    start_time: float  # in seconds
    end_time: float    # in seconds
    chinese_text: str
    vietnamese_text: str = ""
    speaker: str = ""
    voice_gender: VoiceGender = "female"
    pinyin: str = ""
    tts_audio_path: Optional[str] = None
    stretched_audio_path: Optional[str] = None
    orig_duration: float = field(init=False)
    tts_duration: float = 0.0
    speed_factor: float = 1.0

    def __post_init__(self):
        self.orig_duration = max(0.2, round(self.end_time - self.start_time, 3))
        if not self.speaker and self.vietnamese_text:
            lower = self.vietnamese_text.lower()
            if any(k in lower for k in ['bố:', 'ba:', 'cha:', 'anh:', 'ông:', 'chú:', 'bác trai:']):
                self.speaker = 'Bố'
                self.voice_gender = 'male'
            elif any(k in lower for k in ['mẹ:', 'má:', 'chị:', 'bà:', 'cô:', 'bác gái:', 'loa:']):
                self.speaker = 'Mẹ'
                self.voice_gender = 'female'
            elif any(k in lower for k in ['con:', 'em:']):
                self.speaker = 'Con'

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds % 1) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def save_segments_to_srt(segments: List[SubtitleSegment], output_path: str, bilingual: bool = True):
    with open(output_path, 'w', encoding='utf-8') as f:
        for idx, seg in enumerate(segments, 1):
            f.write(f"{idx}\n")
            f.write(f"{format_srt_time(seg.start_time)} --> {format_srt_time(seg.end_time)}\n")
            f.write(f"{seg.vietnamese_text}\n")
            if bilingual and seg.chinese_text:
                f.write(f"{seg.chinese_text}\n")
            f.write("\n")


@dataclass
class PipelineConfig:
    input_video_path: str
    output_video_path: str
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    model_name: str = "gemini-2.5-flash"
    translation_tone: str = "natural"
    voice_female: str = "vi-VN-HoaiMyNeural"
    voice_male: str = "vi-VN-NamMinhNeural"
    max_atempo: float = 1.35
    min_atempo: float = 1.0
    ducking_volume: float = 0.15
    original_volume_pause: float = 0.85
    dubbing_volume: float = 1.0
    burn_subtitles: bool = True
    temp_dir: str = "temp_pipeline"
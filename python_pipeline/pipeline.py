import sys
import io

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
"""
Master Chinese-to-Vietnamese Video AI Translation & Dubbing Pipeline CLI
"""

import os
import sys
import time
import asyncio
import argparse
from typing import Optional, List

from .models import PipelineConfig, SubtitleSegment, save_segments_to_srt
from .translator import TranslationEngine
from .tts_syncer import TTSSynchronizer
from .video_assembler import VideoAssembler


class VideoDubbingPipeline:
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.translator = TranslationEngine(config)
        self.tts = TTSSynchronizer(config)
        self.assembler = VideoAssembler(config)
        os.makedirs(self.config.temp_dir, exist_ok=True)

    def run(self, predefined_segments: Optional[List[SubtitleSegment]] = None) -> str:
        start_time = time.time()
        print("\n" + "=" * 70)
        print("🎬 BẮT ĐẦU PIPELINE DỊCH & LỒNG TIẾNG VIDEO TRUNG - VIỆT CHUYÊN NGHIỆP")
        print("=" * 70)
        print(f"📁 Video đầu vào: {self.config.input_video_path}")
        print(f"📁 Video xuất ra: {self.config.output_video_path}")
        print(f"🤖 Model dịch: {self.config.model_name} (Phong cách: {self.config.translation_tone})")
        print(f"🎙️ Giọng lồng tiếng: Nữ = {self.config.voice_female} | Nam = {self.config.voice_male}")
        print(f"⚡ Giới hạn co giãn atempo: {self.config.min_atempo}x - {self.config.max_atempo}x")
        print("=" * 70 + "\n")

        # 1. Đo thời lượng video
        total_duration = self.assembler.get_video_duration(self.config.input_video_path)
        print(f"⏱️ [1/6] Video gốc dài: {total_duration:.2f} giây")

        # 2. Trích xuất âm thanh từ video
        extracted_wav = os.path.join(self.config.temp_dir, "extracted_original_audio.wav")
        print(f"🎵 [2/6] Đang trích xuất audio gốc sang WAV 44.1kHz stereo...")
        self.assembler.extract_audio(self.config.input_video_path, extracted_wav)

        # 3. Bóc băng & Dịch thuật
        print(f"🧠 [3/6] Đang bóc băng tiếng Trung & Dịch ngữ cảnh sang tiếng Việt...")
        segments = predefined_segments
        if not segments:
            segments = self.translator.transcribe_and_translate_multimodal(extracted_wav)
        
        if not segments:
            raise RuntimeError("Không thể bóc băng hoặc dịch lời thoại từ video.")

        # Thẩm định 100% bản dịch
        segments = self.translator.verify_and_refine_segments(segments)

        # Lưu file phụ đề SRT song ngữ
        srt_path = os.path.join(self.config.temp_dir, "subtitles.srt")
        save_segments_to_srt(segments, srt_path, bilingual=True)
        print(f"   📝 Đã lưu phụ đề SRT song ngữ ({len(segments)} câu): {srt_path}")

        # 4. Tạo giọng đọc AI & Co giãn tốc độ theo timestamp
        print(f"\n🎙️ [4/6] Đang tạo giọng đọc Edge-TTS & Co giãn tốc độ (atempo) khớp từng câu...")
        synced_segments = self.tts.synthesize_all_segments(segments)

        # 5. Ghép nối track âm thanh lồng tiếng master với silence padding
        print(f"\n🎛️ [5/6] Đang ghép nối track lồng tiếng liên tục theo timeline...")
        dubbing_master_wav = os.path.join(self.config.temp_dir, "master_vietnamese_dubbing.wav")
        self.tts.generate_master_dubbing_track(synced_segments, total_duration, dubbing_master_wav)

        # Hòa âm với âm thanh gốc (Audio Ducking)
        mixed_audio_wav = os.path.join(self.config.temp_dir, "mixed_final_audio.wav")
        self.assembler.duck_and_mix_audio(extracted_wav, dubbing_master_wav, mixed_audio_wav)

        # 6. Đóng gói video hoàn chỉnh
        print(f"\n🎬 [6/6] Đang ráp video hoàn chỉnh...")
        output_video = self.assembler.assemble_final_video(
            self.config.input_video_path,
            mixed_audio_wav,
            srt_path if self.config.burn_subtitles else None,
            self.config.output_video_path
        )

        elapsed = time.time() - start_time
        print("\n" + "=" * 70)
        print(f"🎉 HOÀN TẤT 100%! Thời gian xử lý: {elapsed:.2f}s")
        print(f"🎥 Video hoàn chỉnh: {output_video}")
        print("=" * 70 + "\n")
        return output_video


def main():
    parser = argparse.ArgumentParser(description="Chinese-to-Vietnamese Video AI Translation & Dubbing Pipeline")
    parser.add_argument("--input", "-i", required=True, help="Đường dẫn file video tiếng Trung đầu vào")
    parser.add_argument("--output", "-o", default=None, help="Đường dẫn file video đầu ra")
    parser.add_argument("--gemini-key", "-k", default=None, help="Google Gemini API Key")
    parser.add_argument("--model", "-m", default="gemini-2.5-flash", help="Gemini Model")
    parser.add_argument("--tone", "-t", default="natural", help="Phong cách dịch (natural, cinematic, humorous)")
    parser.add_argument("--voice-female", default="vi-VN-HoaiMyNeural", help="Giọng nữ Edge-TTS")
    parser.add_argument("--voice-male", default="vi-VN-NamMinhNeural", help="Giọng nam Edge-TTS")
    parser.add_argument("--max-atempo", type=float, default=1.35, help="Tối đa tăng tốc âm thanh (mặc định 1.35x)")
    parser.add_argument("--ducking-volume", type=float, default=0.15, help="Âm lượng video gốc khi lồng tiếng nói (0.15 = 15 phan tram)")
    parser.add_argument("--no-burn-subtitles", action="store_true", help="Không gắn cứng phụ đề vào khung hình video")

    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    if not os.path.exists(input_path):
        print(f"❌ Không tìm thấy file video: {input_path}")
        sys.exit(1)

    if not args.output:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_Vietnamese_Dubbed.mp4"
    else:
        output_path = os.path.abspath(args.output)

    gemini_key = args.gemini_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    config = PipelineConfig(
        input_video_path=input_path,
        output_video_path=output_path,
        gemini_api_key=gemini_key,
        model_name=args.model,
        translation_tone=args.tone,
        voice_female=args.voice_female,
        voice_male=args.voice_male,
        max_atempo=args.max_atempo,
        ducking_volume=args.ducking_volume,
        burn_subtitles=not args.no_burn_subtitles
    )

    pipeline = VideoDubbingPipeline(config)
    pipeline.run()


if __name__ == "__main__":
    main()
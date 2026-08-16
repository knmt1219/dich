import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

"""
TTS Generation & Audio Synchronization Engine via Edge-TTS & FFmpeg atempo
"""

import os
import re
import wave
import time
import asyncio
import subprocess
import urllib.request
import urllib.parse
from typing import List
import edge_tts
from .models import SubtitleSegment, PipelineConfig

def clean_tts_text(text: str) -> str:
    """Strip speaker prefixes like 'Bố: ', 'Mẹ: ', 'Con: ' and normalize punctuation."""
    cleaned = re.sub(r'^\s*[-*•]?\s*[^:：\(\[]+[:：]\s*', '', text)
    cleaned = re.sub(r'[\(\[][^\)\]]*[\)\]]', '', cleaned)
    cleaned = re.sub(r'\.{2,}', '.', cleaned)
    cleaned = cleaned.strip()
    return cleaned if cleaned else "..."


def get_audio_duration_ffprobe(file_path: str) -> float:
    """Measure exact duration of an audio file in seconds via ffprobe."""
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(result.stdout.strip())
    except Exception:
        try:
            with wave.open(file_path, 'rb') as wf:
                return wf.getnframes() / float(wf.getframerate())
        except Exception:
            return 1.0


def fetch_fallback_tts(text: str, output_path: str) -> bool:
    """Fetch high quality Vietnamese Neural TTS MP3 via Google Translate TTS fallback."""
    try:
        clean = text.strip()[:200]
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=dict-chrome-ex&q={urllib.parse.quote(clean)}"
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp, open(output_path, 'wb') as f:
            f.write(resp.read())
        return os.path.exists(output_path) and os.path.getsize(output_path) > 100
    except Exception as e:
        print(f"      ⚠️ Fallback TTS error: {e}")
        return False


def synthesize_edge_tts_cli(text: str, voice: str, output_path: str) -> bool:
    """Synthesize Edge-TTS via robust CLI process."""
    try:
        cmd = ['edge-tts', '--text', text, '--voice', voice, '--write-media', output_path]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10.0)
        return res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 100
    except Exception:
        return False


class TTSSynchronizer:
    def __init__(self, config: PipelineConfig):
        self.config = config
        os.makedirs(self.config.temp_dir, exist_ok=True)

    def synthesize_segment(self, segment: SubtitleSegment, idx: int) -> SubtitleSegment:
        """
        Synthesize single segment using Edge-TTS with fallback and atempo speed matching.
        """
        text = clean_tts_text(segment.vietnamese_text)
        voice = self.config.voice_female
        if segment.voice_gender == 'male':
            voice = self.config.voice_male

        temp_mp3 = os.path.join(self.config.temp_dir, f"tts_{idx:03d}_raw.mp3")
        stretched_wav = os.path.join(self.config.temp_dir, f"tts_{idx:03d}_sync.wav")

        # 1. Edge-TTS CLI synthesis (super fast & stable on Windows)
        success = synthesize_edge_tts_cli(text, voice, temp_mp3)

        if not success:
            # Fallback 1: Async Communicate
            try:
                communicate = edge_tts.Communicate(text, voice)
                asyncio.run(communicate.save(temp_mp3))
                success = os.path.exists(temp_mp3) and os.path.getsize(temp_mp3) > 100
            except Exception:
                success = False

        if not success:
            # Fallback 2: Google Neural TTS
            fetch_fallback_tts(text, temp_mp3)

        segment.tts_audio_path = temp_mp3

        # 2. Duration Measurement
        dur_tts = get_audio_duration_ffprobe(temp_mp3)
        segment.tts_duration = dur_tts
        dur_orig = segment.orig_duration

        # 3. Dynamic Speed Co giãn (atempo)
        # Limit atempo to 1.0 - 1.35 (max 1.4) to preserve voice pitch and naturalness
        speed = 1.0
        if dur_tts > dur_orig:
            speed = min(self.config.max_atempo, round(dur_tts / max(0.3, dur_orig - 0.05), 3))
            speed = max(self.config.min_atempo, speed)
        
        segment.speed_factor = speed

        # 4. FFmpeg atempo processing & soft fade
        filter_str = f"atempo={speed}"
        effective_dur = dur_tts / speed
        if effective_dur > dur_orig:
            fade_start = max(0.1, dur_orig - 0.08)
            filter_str += f",afade=t=out:st={fade_start:.3f}:d=0.08,atrim=0:{dur_orig:.3f}"

        cmd = [
            'ffmpeg', '-y', '-v', 'error',
            '-i', temp_mp3,
            '-filter:a', filter_str,
            '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le',
            stretched_wav
        ]
        subprocess.run(cmd, check=True)
        segment.stretched_audio_path = stretched_wav

        return segment

    def synthesize_all_segments(self, segments: List[SubtitleSegment]) -> List[SubtitleSegment]:
        """
        Process all subtitle segments with TTS generation and synchronization.
        """
        print(f"   🔊 Đang tạo giọng đọc AI Edge-TTS cho {len(segments)} câu thoại...")
        synced_segments = []
        for idx, seg in enumerate(segments, 1):
            synced_seg = self.synthesize_segment(seg, idx)
            dur_final = get_audio_duration_ffprobe(synced_seg.stretched_audio_path)
            voice_label = "NamMinh (Nam)" if synced_seg.voice_gender == 'male' else "HoaiMy (Nữ)"
            print(f"      [#{idx:02d}] {synced_seg.start_time:.1f}s -> {synced_seg.end_time:.1f}s (gốc: {synced_seg.orig_duration:.2f}s | TTS: {synced_seg.tts_duration:.2f}s -> atempo: {synced_seg.speed_factor:.2f}x -> {dur_final:.2f}s) [{voice_label}]")
            synced_segments.append(synced_seg)

        return synced_segments

    def generate_master_dubbing_track(self, segments: List[SubtitleSegment], total_duration: float, output_path: str) -> str:
        """
        Assemble all individual synced audio clips onto a continuous timeline with sample-accurate silence padding.
        Output is a pristine 44.1kHz stereo 16-bit PCM WAV.
        """
        print(f"   🎛️ Đang ghép nối timeline âm thanh lồng tiếng hoàn chỉnh ({total_duration:.2f}s)...")
        sample_rate = 44100
        channels = 2
        bytes_per_sample = 2  # 16-bit
        frame_size = channels * bytes_per_sample

        total_frames = int(total_duration * sample_rate)
        master_pcm = bytearray(total_frames * frame_size)  # Initialized with zero (silence)

        for seg in segments:
            if not seg.stretched_audio_path or not os.path.exists(seg.stretched_audio_path):
                continue

            start_frame = int(seg.start_time * sample_rate)
            if start_frame >= total_frames:
                continue

            with wave.open(seg.stretched_audio_path, 'rb') as wf:
                seg_frames = wf.readframes(wf.getnframes())
                seg_nframes = len(seg_frames) // frame_size

                # Paste segment into master buffer
                available_frames = min(seg_nframes, total_frames - start_frame)
                start_byte = start_frame * frame_size
                end_byte = start_byte + available_frames * frame_size
                master_pcm[start_byte:end_byte] = seg_frames[:available_frames * frame_size]

        # Write master WAV file
        with wave.open(output_path, 'wb') as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(bytes_per_sample)
            wf.setframerate(sample_rate)
            wf.writeframes(master_pcm)

        print(f"   ✅ Đã tạo track lồng tiếng đồng bộ mẫu: {output_path} ({os.path.getsize(output_path)/(1024*1024):.2f} MB)")
        return output_path
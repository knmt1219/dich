import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
"""
Video & Audio Assembly Module via FFmpeg (Audio Ducking, Subtitle Burning & Muxing)
"""

import os
import subprocess
from typing import Optional
from .models import PipelineConfig

class VideoAssembler:
    def __init__(self, config: PipelineConfig):
        self.config = config
        os.makedirs(self.config.temp_dir, exist_ok=True)

    def get_video_duration(self, video_path: str) -> float:
        """Get exact duration of video in seconds."""
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(res.stdout.strip())

    def extract_audio(self, video_path: str, output_wav: str) -> str:
        """Extract high-quality 44.1kHz stereo WAV from video."""
        cmd = [
            'ffmpeg', '-y', '-v', 'error',
            '-i', video_path,
            '-vn',
            '-c:a', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            output_wav
        ]
        subprocess.run(cmd, check=True)
        return output_wav

    def duck_and_mix_audio(self, orig_wav: str, dub_wav: str, output_mixed_wav: str) -> str:
        """
        Mix original video audio (ducked to background level) with the new Vietnamese dubbing track.
        """
        print(f"   🎚️ Đang hòa âm (Audio Ducking: BGM gốc {int(self.config.ducking_volume*100)}% + Giọng lồng tiếng {int(self.config.dubbing_volume*100)}%)...")
        
        # Audio filter graph: Original ducked by volume, Dubbing normalized, mixed cleanly
        filter_graph = f"[0:a]volume={self.config.ducking_volume}[a_orig];[1:a]volume={self.config.dubbing_volume}[a_dub];[a_orig][a_dub]amix=inputs=2:duration=first:dropout_transition=2[a_out]"
        
        cmd = [
            'ffmpeg', '-y', '-v', 'error',
            '-i', orig_wav,
            '-i', dub_wav,
            '-filter_complex', filter_graph,
            '-map', '[a_out]',
            '-c:a', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            output_mixed_wav
        ]
        subprocess.run(cmd, check=True)
        return output_mixed_wav

    def assemble_final_video(
        self,
        input_video: str,
        mixed_audio: str,
        srt_path: Optional[str],
        output_video: str
    ) -> str:
        """
        Multiplex video stream and mixed audio track, optionally burning styled subtitles.
        """
        print(f"   🎬 Đang đóng gói video hoàn chỉnh ({output_video})...")
        
        if self.config.burn_subtitles and srt_path and os.path.exists(srt_path):
            # Escape path for FFmpeg filter on Windows
            escaped_srt = srt_path.replace('\\', '/').replace(':', '\\:')
            subtitle_filter = (
                f"subtitles='{escaped_srt}':force_style="
                "'FontName=Arial,FontSize=19,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
                "BorderStyle=3,Outline=2.2,Shadow=1.0,Alignment=2,MarginV=26'"
            )
            
            cmd = [
                'ffmpeg', '-y', '-v', 'warning',
                '-i', input_video,
                '-i', mixed_audio,
                '-vf', subtitle_filter,
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-c:v', 'libx264',
                '-crf', '20',
                '-preset', 'fast',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-shortest',
                output_video
            ]
        else:
            # Lossless fast stream copy
            cmd = [
                'ffmpeg', '-y', '-v', 'warning',
                '-i', input_video,
                '-i', mixed_audio,
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-shortest',
                output_video
            ]

        subprocess.run(cmd, check=True)
        print(f"   ✅ Đã xuất video thành công: {output_video} ({os.path.getsize(output_video)/(1024*1024):.2f} MB)")
        return output_video
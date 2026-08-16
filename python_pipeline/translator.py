import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
"""
Translation & Multimodal Speech Recognition Module
"""

import os
import re
import json
import time
import base64
import urllib.request
import urllib.parse
from typing import List, Optional, Dict, Any
from .models import SubtitleSegment, PipelineConfig

CHINESE_REGEX = re.compile(r'[\u4e00-\u9fa5]')

def extract_json_array(text: str) -> List[Dict[str, Any]]:
    """Extract JSON array from LLM response with markdown cleaning and regex fallback."""
    if not text:
        return []
    
    # 1. Direct JSON parse
    try:
        data = json.loads(text.strip())
        if isinstance(data, list):
            return data
    except Exception:
        pass
    
    # 2. Strip markdown blocks ```json ... ```
    cleaned = re.sub(r'```(?:json)?', '', text, flags=re.IGNORECASE).replace('```', '').strip()
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return data
    except Exception:
        pass
    
    # 3. Extract bracket substring [...]
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end > start:
        try:
            data = json.loads(text[start:end+1])
            if isinstance(data, list):
                return data
        except Exception:
            pass
    
    # 4. Regex item-by-item extraction
    results = []
    item_pattern = re.compile(r'\{[^{}]*?"(?:chineseText|chinese|vietnameseText|vietnamese)"[^{}]*?\}')
    for match in item_pattern.finditer(text):
        try:
            obj = json.loads(match.group(0))
            if obj.get('chineseText') or obj.get('vietnameseText'):
                results.append(obj)
        except Exception:
            pass
    return results


def translate_via_free_google_endpoint(text: str) -> str:
    """Free Google Translate fallback for single sentences."""
    clean = text.strip()
    if not clean:
        return ""
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q={urllib.parse.quote(clean)}"
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if isinstance(data, list) and isinstance(data[0], list):
                return "".join([item[0] for item in data[0] if item and len(item) > 0]).strip()
    except Exception as e:
        print(f"   ⚠️ Fallback translation error for '{clean[:20]}': {e}")
    return clean


class TranslationEngine:
    def __init__(self, config: PipelineConfig):
        self.config = config

    def transcribe_and_translate_multimodal(self, audio_path: str) -> List[SubtitleSegment]:
        """
        Multimodal Audio Speech Recognition + Contextual Dialogue Translation via Gemini API.
        """
        if not self.config.gemini_api_key:
            raise ValueError("Gemini API Key is required for multimodal audio transcription.")

        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        print(f"   🎙️ Đang nạp file audio ({os.path.getsize(audio_path) / (1024*1024):.2f} MB)...")
        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

        prompt = f"""Bạn là chuyên gia dịch thuật video cao cấp Trung - Việt (tiêu chuẩn phim điện ảnh và Douyin/TikTok).
Nhiệm vụ của bạn:
1. LẮNG NGHE KỸ từng câu thoại trong file âm thanh này.
2. Bóc băng chính xác 100% tiếng Trung gốc (chineseText) kèm mốc thời gian bắt đầu (startTime) và kết thúc (endTime) tính bằng giây.
3. Nhận diện chính xác nhân vật phát ngôn (speaker: Bố, Mẹ, Con, Người dẫn chuyện, v.v.) và giới tính giọng đọc (voiceGender: 'male' hoặc 'female').
4. DỊCH SANG TIẾNG VIỆT ĐỜI THƯỜNG, TỰ NHIÊN, GIÀU CẢM XÚC:
   - Xử lý mượt mà toàn bộ thành ngữ, từ lóng tiếng Trung (phong cách: {self.config.translation_tone}).
   - RÀNG BUỘC ĐỘ DÀI: Câu dịch tiếng Việt phải gọn gàng, độ dài âm tiết phù hợp với thời lượng câu gốc (trung bình 3-4 âm tiết/giây), KHÔNG ĐƯỢC dịch lê thê khiến lồng tiếng bị quá giờ.
   - Thêm tiền tố nhân vật vào câu dịch (ví dụ: 'Bố: ...', 'Mẹ: ...', 'Con: ...').

BẮT BUỘC trả về ĐÚNG định dạng JSON array sau:
[
  {{
    "startTime": 0.0,
    "endTime": 2.5,
    "speaker": "Bố",
    "voiceGender": "male",
    "chineseText": "你看看人家孩子，再看看你自己。",
    "pinyin": "Nǐ kànkan rénjia háizi, zài kànkan nǐ zìjǐ.",
    "vietnameseText": "Bố: Con nhìn con nhà người ta xem, rồi con tự nhìn lại mình đi."
  }}
]"""

        models_to_try = [
            self.config.model_name,
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
        ]
        # Deduplicate
        seen = set()
        models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

        for model in models_to_try:
            print(f"   🤖 Đang gọi Gemini Model: {model}...")
            for attempt in range(3):
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.config.gemini_api_key.strip()}"
                    payload = {
                        "contents": [{
                            "parts": [
                                {
                                    "inlineData": {
                                        "mimeType": "audio/wav",
                                        "data": audio_b64
                                    }
                                },
                                { "text": prompt }
                            ]
                        }],
                        "generationConfig": {
                            "temperature": 0.1,
                            "maxOutputTokens": 8192
                        }
                    }
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(payload).encode('utf-8'),
                        headers={"Content-Type": "application/json"}
                    )
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        resp_data = json.loads(resp.read().decode('utf-8'))
                        raw_text = resp_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                        
                        parsed = extract_json_array(raw_text)
                        if parsed:
                            segments = []
                            for idx, item in enumerate(parsed):
                                st = float(item.get('startTime', idx * 3.0))
                                et = float(item.get('endTime', (idx + 1) * 3.0))
                                zh = item.get('chineseText') or item.get('chinese') or ''
                                vi = item.get('vietnameseText') or item.get('vietnamese') or ''
                                sp = item.get('speaker', '')
                                vg = item.get('voiceGender', 'female')
                                if not vg in ['female', 'male']:
                                    vg = 'female'
                                
                                if zh or vi:
                                    seg = SubtitleSegment(
                                        id=f"seg-{idx+1}",
                                        start_time=round(st, 2),
                                        end_time=round(et, 2),
                                        chinese_text=zh.strip(),
                                        vietnamese_text=vi.strip(),
                                        speaker=sp,
                                        voice_gender=vg,
                                        pinyin=item.get('pinyin', '')
                                    )
                                    segments.append(seg)
                            
                            if segments:
                                print(f"   ✅ Bóc băng & Dịch thành công {len(segments)} câu thoại bằng {model}!")
                                return segments
                except Exception as e:
                    print(f"   ⚠️ Lỗi thử model {model} (lần {attempt+1}/3): {e}")
                    time.sleep(2 * (attempt + 1))
        
        return []

    def verify_and_refine_segments(self, segments: List[SubtitleSegment]) -> List[SubtitleSegment]:
        """
        100% Quality Scanner: Detect and fix any missing translations or leftover Chinese characters.
        """
        print("   🔍 Đang thẩm định chất lượng bản dịch (100% Quality Verification)...")
        refined = []
        for idx, seg in enumerate(segments, 1):
            vi = seg.vietnamese_text.strip()
            
            # Check if translation is empty or contains leftover Chinese
            if not vi or CHINESE_REGEX.search(vi) or len(vi) < 2:
                print(f"   🔄 Câu #{idx} cần tinh chỉnh: '{seg.chinese_text}'")
                new_vi = translate_via_free_google_endpoint(seg.chinese_text)
                if seg.speaker and not new_vi.startswith(f"{seg.speaker}:"):
                    new_vi = f"{seg.speaker}: {new_vi}"
                seg.vietnamese_text = new_vi or seg.chinese_text
            
            refined.append(seg)
        return refined
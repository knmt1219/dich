// Self-Testing Suite for Audio Extraction, Gemini Multimodal Transcript Parser & TTS Rate Math
const assert = require('assert');

// 1. Test Smart Transcript Parser with User's Exact Gemini Screenshot Output
function parseAnyTranscriptText(raw) {
  if (!raw || !raw.trim()) return [];
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results = [];

  const rangeRegex = /(?:([^\(\[\:\-]+?)\s*[\(\[])?\s*(\d{1,2}):(\d{2})(?:\.(\d+))?\s*(?:-|-->|~|đến)\s*(\d{1,2}):(\d{2})(?:\.(\d+))?\s*[\)\]]?\s*[:：\-]?\s*(.*)/i;
  const singleRegex = /(?:([^\(\[\:\-]+?)\s*[\(\[])?\s*(\d{1,2}):(\d{2})(?:\.(\d+))?\s*[\)\]]\s*[:：\-]?\s*(.*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^Phần\s+\d+/i.test(line) || /^Section\s+\d+/i.test(line)) continue;

    const matchRange = line.match(rangeRegex);
    if (matchRange) {
      let speaker = matchRange[1]?.replace(/^[-*•]\s*/, '').trim() || '';
      const startMin = parseInt(matchRange[2], 10);
      const startSec = parseInt(matchRange[3], 10);
      const endMin = parseInt(matchRange[5], 10);
      const endSec = parseInt(matchRange[6], 10);
      const content = matchRange[8]?.trim() || '';

      if (content) {
        const startTime = Math.round((startMin * 60 + startSec) * 10) / 10;
        const endTime = Math.max(startTime + 1.2, Math.round((endMin * 60 + endSec) * 10) / 10);
        const isMale = speaker.toLowerCase().includes('bố') || speaker.toLowerCase().includes('nam') || speaker.toLowerCase().includes('anh') || speaker.toLowerCase().includes('ông');

        results.push({
          startTime,
          endTime,
          chineseText: content,
          vietnameseText: speaker && !speaker.includes('Dòng chữ') ? `${speaker}: ${content}` : content,
          voiceGender: isMale ? 'male' : 'female'
        });
      }
      continue;
    }

    const matchSingle = line.match(singleRegex);
    if (matchSingle) {
      let speaker = matchSingle[1]?.replace(/^[-*•]\s*/, '').trim() || '';
      const startMin = parseInt(matchSingle[2], 10);
      const startSec = parseInt(matchSingle[3], 10);
      const content = matchSingle[5]?.trim() || '';

      if (content) {
        const startTime = Math.round((startMin * 60 + startSec) * 10) / 10;
        const endTime = Math.round((startTime + 3.2) * 10) / 10;

        results.push({
          startTime,
          endTime,
          chineseText: content,
          vietnameseText: speaker && !speaker.includes('Dòng chữ') ? `${speaker}: ${content}` : content,
          voiceGender: 'female'
        });
      }
    }
  }

  return results;
}

console.log('--- TEST 1: Parsing User Screenshot Script ---');
const sampleUserScript = `
Phần 1: Áp lực từ điểm số và so sánh
- Dòng chữ trên màn hình (00:00): Mỗi lần thi kém đều nói những lời giống nhau
- Bố (00:00 - 00:02): Con nhìn con nhà người ta xem, rồi con tự nhìn lại mình đi.
- Mẹ (00:03 - 00:07): Đúng thế đấy, cũng bỏ ra từng ấy tiền, ăn uống cũng chẳng thua kém ai cái gì...
- Con (00:08 - 00:10): Bố, lần này đề thi thật sự rất khó...
- Bố (00:11 - 00:12): Thế sao con nhà người ta lại thi tốt được như vậy hả?
`;

const parsed = parseAnyTranscriptText(sampleUserScript);
console.log(`Parsed ${parsed.length} segments.`);
assert(parsed.length === 5, `Expected 5 segments, got ${parsed.length}`);
assert(parsed[1].startTime === 0 && parsed[1].endTime === 2, 'Bố timestamp mismatch');
assert(parsed[1].vietnameseText.includes('Con nhìn con nhà người ta'), 'Bố text mismatch');
assert(parsed[1].voiceGender === 'male', 'Bố should be male voice');
assert(parsed[2].startTime === 3 && parsed[2].endTime === 7, 'Mẹ timestamp mismatch');
assert(parsed[2].voiceGender === 'female', 'Mẹ should be female voice');
console.log('✅ TEST 1 PASSED: Transcript Parser correctly extracted all speakers and timestamps!');

// 2. Test JSON Array Extractor with various Gemini response formats
function extractJsonArray(rawText) {
  if (!rawText) return [];
  try {
    const res = JSON.parse(rawText);
    if (Array.isArray(res)) return res;
  } catch {}

  try {
    const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const res = JSON.parse(cleaned);
    if (Array.isArray(res)) return res;
  } catch {}

  try {
    const startIdx = rawText.indexOf('[');
    const endIdx = rawText.lastIndexOf(']');
    if (startIdx !== -1 && endIdx > startIdx) {
      const slice = rawText.slice(startIdx, endIdx + 1);
      const res = JSON.parse(slice);
      if (Array.isArray(res)) return res;
    }
  } catch {}

  return [];
}

console.log('\n--- TEST 2: Gemini JSON Extractor ---');
const markdownGeminiResponse = '```json\n[\n  {"startTime": 0.0, "endTime": 2.5, "chineseText": "你好", "vietnameseText": "Xin chào"}\n]\n```';
const extracted = extractJsonArray(markdownGeminiResponse);
assert(extracted.length === 1 && extracted[0].vietnameseText === 'Xin chào', 'Failed to parse markdown JSON');
console.log('✅ TEST 2 PASSED: Gemini JSON array parsed cleanly!');

// 3. Test Dynamic Speech Rate Calculation
function calculateDynamicRate(text, durationSeconds, baseRate = 1.0) {
  if (!durationSeconds || durationSeconds <= 0) return baseRate;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return baseRate;
  const estimatedNormalSeconds = Math.max(0.5, (words / 3.5) + 0.15);
  const targetSeconds = Math.max(0.4, durationSeconds - 0.1);
  const requiredRate = (estimatedNormalSeconds / targetSeconds) * baseRate;
  return Math.min(2.5, Math.max(0.8, Math.round(requiredRate * 100) / 100));
}

console.log('\n--- TEST 3: Dynamic Speech Rate ---');
const shortText = 'Xin chào bạn'; // 3 words, 2 seconds -> should be normal rate ~0.8 - 1.0
const normalRate = calculateDynamicRate(shortText, 2.0);
console.log(`Normal sentence rate: ${normalRate}x`);
assert(normalRate >= 0.8 && normalRate <= 1.2, 'Normal rate out of expected range');

const longText = 'Con nhìn con nhà người ta xem rồi con tự nhìn lại bản thân mình đi xem có được bằng một góc của người ta không'; // 25 words in 3s -> should speed up
const fastRate = calculateDynamicRate(longText, 3.0);
console.log(`Fast sentence rate for dense text in short time: ${fastRate}x`);
assert(fastRate > 1.3, 'Long text should have elevated rate for auto-sync');
console.log('✅ TEST 3 PASSED: Speech rate calculation accurately synchronizes duration with video timeline!');

console.log('\n🎉 ALL SELF-TESTS COMPLETED WITH 100% SUCCESS!');

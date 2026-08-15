import type { SubtitleSegment, SubtitleStyle } from '../types/video';

/**
 * Format seconds to SRT time format: 00:00:00,000
 */
export function formatTimeSRT(seconds: number): string {
  const date = new Date(0);
  date.setUTCMilliseconds(Math.floor(seconds * 1000));
  const timeString = date.toISOString().slice(11, 23);
  return timeString.replace('.', ',');
}

/**
 * Format seconds to VTT time format: 00:00:00.000
 */
export function formatTimeVTT(seconds: number): string {
  const date = new Date(0);
  date.setUTCMilliseconds(Math.floor(seconds * 1000));
  return date.toISOString().slice(11, 23);
}

/**
 * Generate SRT subtitle file string
 */
export function generateSRT(
  subtitles: SubtitleSegment[],
  mode: 'vi-only' | 'bilingual' | 'zh-only' = 'vi-only'
): string {
  return subtitles
    .map((sub, index) => {
      const idx = index + 1;
      const start = formatTimeSRT(sub.startTime);
      const end = formatTimeSRT(sub.endTime);
      
      let text = sub.vietnameseText;
      if (mode === 'bilingual') {
        text = `${sub.chineseText}\n${sub.vietnameseText}`;
      } else if (mode === 'zh-only') {
        text = sub.chineseText;
      }

      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
}

/**
 * Generate WebVTT subtitle file string
 */
export function generateVTT(
  subtitles: SubtitleSegment[],
  mode: 'vi-only' | 'bilingual' | 'zh-only' = 'vi-only'
): string {
  let vtt = 'WEBVTT\n\n';
  vtt += subtitles
    .map((sub, index) => {
      const idx = index + 1;
      const start = formatTimeVTT(sub.startTime);
      const end = formatTimeVTT(sub.endTime);
      
      let text = sub.vietnameseText;
      if (mode === 'bilingual') {
        text = `${sub.chineseText}\n${sub.vietnameseText}`;
      } else if (mode === 'zh-only') {
        text = sub.chineseText;
      }

      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join('\n');
  return vtt;
}

/**
 * Generate plain text script
 */
export function generateTXT(subtitles: SubtitleSegment[]): string {
  let content = '=== KỊCH BẢN PHỤ ĐỀ TRUNG - VIỆT ===\n\n';
  subtitles.forEach((sub, i) => {
    content += `[${i + 1}] (${sub.startTime.toFixed(1)}s - ${sub.endTime.toFixed(1)}s)\n`;
    content += `Tiếng Trung: ${sub.chineseText}\n`;
    if (sub.pinyin) content += `Pinyin: ${sub.pinyin}\n`;
    content += `Tiếng Việt: ${sub.vietnameseText}\n\n`;
  });
  return content;
}

/**
 * Download text or blob file
 */
export function downloadFile(content: string | Blob, fileName: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Draw Ultra-Beautiful Subtitle on Canvas with Glassmorphism, Rounded Borders & Smooth Karaoke Glow
 */
export function drawSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  subtitle: SubtitleSegment | undefined,
  style: SubtitleStyle,
  currentTime = 0
) {
  if (!subtitle) return;

  const displayVi = style.displayMode !== 'zh-only';
  const displayZh = style.displayMode === 'bilingual' || style.displayMode === 'zh-only';

  const scale = width / 1280;
  const fontSize = Math.max(18, Math.round(style.fontSize * scale));
  const fontStyle = `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${fontSize}px ${style.fontFamily || 'Inter, sans-serif'}`;
  
  ctx.save();
  ctx.font = fontStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Smooth roll-up entrance transition (first 0.2s floats upward)
  const timeSinceStart = currentTime - subtitle.startTime;
  const rollUpOffset = timeSinceStart >= 0 && timeSinceStart < 0.2
    ? (0.2 - timeSinceStart) * 25 * scale
    : 0;

  const yPos = ((height * style.positionY) / 100) + rollUpOffset;
  const lineHeight = fontSize * 1.42;

  const linesToDraw: Array<{ type: 'zh' | 'vi'; text: string }> = [];
  if (displayZh && subtitle.chineseText) {
    linesToDraw.push({ type: 'zh', text: subtitle.chineseText });
  }
  if (displayVi && subtitle.vietnameseText) {
    linesToDraw.push({ type: 'vi', text: subtitle.vietnameseText });
  }

  if (linesToDraw.length === 0) {
    ctx.restore();
    return;
  }

  // Calculate box dimensions for background
  const textMetrics = linesToDraw.map(line => ctx.measureText(line.text).width);
  const maxTextWidth = Math.max(...textMetrics);
  const paddingH = Math.max(16 * scale, style.backgroundPadding * scale * 1.5);
  const paddingV = Math.max(10 * scale, style.backgroundPadding * scale * 0.9);
  const boxWidth = maxTextWidth + paddingH * 2;
  const boxHeight = linesToDraw.length * lineHeight + paddingV * 1.5;
  const boxX = width / 2 - boxWidth / 2;
  const boxY = yPos - boxHeight / 2;
  const borderRadius = Math.max(8 * scale, (style.borderRadius || 10) * scale);

  // 1. Frosted Glass Background Box with Subtle Border
  if (style.backgroundColor && style.backgroundColor !== 'transparent') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Background Fill
    ctx.fillStyle = style.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius);
    ctx.fill();

    // Subtle Glass Border Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.restore();
  }

  // Calculate progress in current segment for Karaoke
  const segmentDuration = Math.max(0.1, subtitle.endTime - subtitle.startTime);
  const rawProgress = (currentTime - subtitle.startTime) / segmentDuration;
  const progress = Math.max(0, Math.min(1, rawProgress));

  // 2. Draw Text Lines with Rich Drop Shadows & Active Word Glow
  linesToDraw.forEach((item, index) => {
    const lineY = yPos - ((linesToDraw.length - 1) * lineHeight) / 2 + index * lineHeight;

    if (item.type === 'vi' && style.enableKaraoke) {
      // Word-by-word Karaoke Rendering
      const words = item.text.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length;
      const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));

      const spaceWidth = ctx.measureText(' ').width;
      const wordWidths = words.map(w => ctx.measureText(w).width);
      const totalLineWidth = wordWidths.reduce((a, b) => a + b, 0) + (words.length - 1) * spaceWidth;
      
      let currentX = (width / 2) - (totalLineWidth / 2);

      ctx.textAlign = 'left';

      words.forEach((word, wIdx) => {
        const isSpoken = wIdx <= activeWordIndex;
        const isCurrentActive = wIdx === activeWordIndex;

        // Outline Stroke
        if (style.strokeWidth > 0) {
          ctx.lineWidth = style.strokeWidth * scale * 2.2;
          ctx.strokeStyle = style.strokeColor || '#000000';
          ctx.lineJoin = 'round';
          ctx.strokeText(word, currentX, lineY);
        }

        // Text Fill with Dynamic Glow
        if (isCurrentActive) {
          ctx.fillStyle = style.highlightColor || '#fde047';
          ctx.shadowColor = style.highlightColor || '#fde047';
          ctx.shadowBlur = 14 * scale;
        } else if (isSpoken) {
          ctx.fillStyle = style.highlightColor || '#fde047';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 4 * scale;
        } else {
          ctx.fillStyle = style.primaryColor || '#ffffff';
          ctx.shadowColor = style.shadow ? 'rgba(0, 0, 0, 0.85)' : 'transparent';
          ctx.shadowBlur = style.shadow ? 6 * scale : 0;
        }

        ctx.fillText(word, currentX, lineY);
        currentX += wordWidths[wIdx] + spaceWidth;
      });

      ctx.textAlign = 'center';
    } else {
      // Standard Line Rendering (e.g. Chinese Hanzi or Non-karaoke)
      if (style.strokeWidth > 0) {
        ctx.lineWidth = style.strokeWidth * scale * 2.2;
        ctx.strokeStyle = style.strokeColor || '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(item.text, width / 2, lineY);
      }

      ctx.shadowColor = style.shadow ? 'rgba(0, 0, 0, 0.85)' : 'transparent';
      ctx.shadowBlur = style.shadow ? 6 * scale : 0;
      ctx.fillStyle = item.type === 'zh' ? '#fde047' : (style.primaryColor || '#ffffff');
      ctx.fillText(item.text, width / 2, lineY);
    }
  });

  ctx.restore();
}

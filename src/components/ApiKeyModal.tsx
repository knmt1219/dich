import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check, Info, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GeminiModel } from '../types/video';
import { getStoredApiKey, saveStoredApiKey, testGeminiApiKey } from '../services/aiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  geminiModel: GeminiModel;
  onModelChange: (model: GeminiModel) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  geminiModel,
  onModelChange
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const keys = getStoredApiKey();
      setGeminiKey(keys.geminiKey);
      setOpenaiKey(keys.openaiKey);
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key Google Gemini để kiểm tra.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(geminiKey.trim(), geminiModel);
      setTestResult(res);
      if (res.success && res.workingModel) {
        onModelChange(res.workingModel);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredApiKey(geminiKey, openaiKey);
    setSavedSuccess(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '580px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Key size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              Tích Hợp Google Gemini AI (Dịch Tự Động 100%)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem'
          }}>
            <Info size={18} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Gemini API Key giúp dịch toàn bộ video tiếng Trung trong 1 giây với ngữ cảnh chuẩn xác. Key được lưu an toàn trong trình duyệt của bạn (localStorage) và hoàn toàn <strong>miễn phí</strong> từ Google.
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
              Chọn mô hình Gemini AI:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Ổn định nhất)', sub: 'Khuyên dùng 100% key' },
                { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', sub: 'Mô hình thế hệ mới' },
                { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', sub: 'Dịch thuật chuyên sâu' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => onModelChange(m.id as GeminiModel)}
                  style={{
                    backgroundColor: geminiModel === m.id ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-card)',
                    border: `1.5px solid ${geminiModel === m.id ? '#3b82f6' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.5rem 0.35rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: geminiModel === m.id ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{m.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini Key Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                Google Gemini API Key:
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.75rem',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  textDecoration: 'none'
                }}
              >
                <span>Lấy key miễn phí (30s)</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Dán mã API Key: AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.85rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !geminiKey.trim()}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}
              >
                {isTesting ? <Loader2 size={14} className="audio-bar" /> : <Sparkles size={14} />}
                <span>Kiểm Tra Key</span>
              </button>
            </div>

            {/* Test result status */}
            {testResult && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: testResult.success ? '#34d399' : '#f87171',
                border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`
              }}>
                {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {savedSuccess ? <Check size={16} /> : <Sparkles size={16} />}
              <span>{savedSuccess ? 'Đã lưu!' : 'Lưu & Bắt Đầu Dịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

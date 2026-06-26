'use client';

import React, { useState } from 'react';
import { NodeCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/workflow';

interface Props {
  selectedCount: number;
  nodeCount: number;
  connectionCount: number;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onAddNode: (category: NodeCategory) => void;
  onDeleteSelected: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
}

const CATEGORIES: NodeCategory[] = ['trigger', 'input', 'process', 'ai', 'decision', 'output', 'storage', 'manual'];

export default function Toolbar({
  selectedCount, nodeCount, connectionCount,
  apiKey, onApiKeyChange,
  onAddNode, onDeleteSelected, onAnalyze, onClear, onSave, onLoad,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      style={{
        height: 52,
        background: '#111827',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
        }}>
          W
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: -0.3 }}>Workflow AI</span>
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />

      {/* Add Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowAdd((v) => !v); setShowSettings(false); }}
          style={btnStyle('#3b82f6', 'rgba(59,130,246,0.15)')}
        >
          ＋ 新增節點
        </button>
        {showAdd && (
          <div style={{
            position: 'absolute', top: '110%', left: 0,
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: 8, minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200,
          }}>
            {CATEGORIES.map((cat) => {
              const c = CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => { onAddNode(cat); setShowAdd(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent',
                    color: '#cbd5e1', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.border }} />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Selected */}
      {selectedCount > 0 && (
        <button
          onClick={onDeleteSelected}
          style={btnStyle('#ef4444', 'rgba(239,68,68,0.12)')}
        >
          🗑 刪除 ({selectedCount})
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#475569' }}>
        <span>節點 <b style={{ color: '#94a3b8' }}>{nodeCount}</b></span>
        <span>連接 <b style={{ color: '#94a3b8' }}>{connectionCount}</b></span>
        {selectedCount > 0 && <span>選中 <b style={{ color: '#60a5fa' }}>{selectedCount}</b></span>}
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />

      {/* Save / Load */}
      <button onClick={onSave} style={btnStyle('#64748b', 'rgba(100,116,139,0.15)')} title="儲存到瀏覽器">💾</button>
      <button onClick={onLoad} style={btnStyle('#64748b', 'rgba(100,116,139,0.15)')} title="從瀏覽器載入">📂</button>
      <button onClick={() => { if (confirm('確定清空畫布？')) onClear(); }} style={btnStyle('#64748b', 'rgba(100,116,139,0.15)')} title="清空">⬜</button>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />

      {/* AI Analyze */}
      <button
        onClick={onAnalyze}
        disabled={selectedCount === 0}
        style={{
          ...btnStyle('#7c3aed', 'rgba(124,58,237,0.2)'),
          opacity: selectedCount === 0 ? 0.4 : 1,
          background: selectedCount > 0 ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.2))' : undefined,
          border: selectedCount > 0 ? '1px solid rgba(139,92,246,0.5)' : undefined,
        }}
        title={selectedCount === 0 ? '請先選取節點' : `分析 ${selectedCount} 個節點`}
      >
        ✦ AI 自動化分析
        {selectedCount > 0 && <span style={{ marginLeft: 4, opacity: 0.8, fontSize: 10 }}>({selectedCount})</span>}
      </button>

      {/* Settings */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowSettings((v) => !v); setShowAdd(false); }}
          style={{ ...btnStyle('#64748b', 'rgba(100,116,139,0.15)'), borderColor: apiKey ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)' }}
          title="API 設定"
        >
          ⚙
        </button>
        {showSettings && (
          <div style={{
            position: 'absolute', top: '110%', right: 0,
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: 16, width: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Anthropic API Key</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: '#e2e8f0', padding: '6px 10px', fontSize: 12, outline: 'none',
                }}
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
              >
                {showKey ? '隱藏' : '顯示'}
              </button>
            </div>
            <button
              onClick={() => { onApiKeyChange(apiKeyInput); setShowSettings(false); }}
              style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              儲存
            </button>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>
              Key 僅儲存於本機，不會上傳到伺服器。<br />
              取得 API Key：<a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>console.anthropic.com</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(color: string, bg: string): React.CSSProperties {
  return {
    padding: '5px 12px', borderRadius: 7,
    border: `1px solid ${color}30`,
    background: bg,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };
}

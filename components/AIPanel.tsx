'use client';

import React, { useRef, useEffect } from 'react';

interface Props {
  content: string;
  isLoading: boolean;
  onClose: () => void;
}

// Minimal markdown renderer: bold, headings, code, lists
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const els: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      els.push(<h2 key={i} style={{ fontSize: 14, fontWeight: 700, color: '#93c5fd', margin: '16px 0 6px', borderBottom: '1px solid rgba(59,130,246,0.2)', paddingBottom: 4 }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      els.push(<h3 key={i} style={{ fontSize: 13, fontWeight: 600, color: '#a5f3fc', margin: '12px 0 4px' }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      els.push(
        <ul key={`ul-${i}`} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {items.map((it, j) => <li key={j} style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: boldify(it) }} />)}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      els.push(
        <ol key={`ol-${i}`} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {items.map((it, j) => <li key={j} style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: boldify(it) }} />)}
        </ol>
      );
      continue;
    } else if (line.trim() === '') {
      els.push(<div key={i} style={{ height: 4 }} />);
    } else {
      els.push(<p key={i} style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.75, margin: '2px 0' }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />);
    }
    i++;
  }
  return els;
}

function boldify(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;font-size:11.5px;color:#7dd3fc">$1</code>');
}

export default function AIPanel({ content, isLoading, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [content]);

  return (
    <div
      style={{
        height: 380,
        background: '#0f172a',
        borderTop: '1px solid rgba(167,139,250,0.3)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: '0 -4px 24px rgba(139,92,246,0.12)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(6,182,212,0.1))',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}
        >
          ✦
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>AI 自動化分析報告</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>由 Claude 生成 · 點選連接線可刪除</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#94a3b8', padding: '4px 10px', cursor: 'pointer', fontSize: 12,
          }}
        >
          關閉
        </button>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', paddingTop: 16 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #6d28d9', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13 }}>AI 正在分析工作流程...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div>{renderMarkdown(content)}</div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowNode, Port, NodeCategory, PortDataType, CATEGORY_LABELS, PORT_TYPE_COLORS } from '@/types/workflow';

const CATEGORIES: NodeCategory[] = ['trigger', 'input', 'process', 'ai', 'decision', 'output', 'storage', 'manual'];
const PORT_TYPES: PortDataType[] = ['any', 'text', 'number', 'boolean', 'file', 'image', 'json', 'trigger', 'array'];

function uid() { return `p${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

interface PortEditorProps {
  ports: Port[];
  label: string;
  onChange: (ports: Port[]) => void;
}

function PortEditor({ ports, label, onChange }: PortEditorProps) {
  const add = () => onChange([...ports, { id: uid(), name: '新欄位', dataType: 'any', description: '' }]);
  const update = (i: number, partial: Partial<Port>) =>
    onChange(ports.map((p, idx) => idx === i ? { ...p, ...partial } : p));
  const remove = (i: number) => onChange(ports.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <button
          onClick={add}
          style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'rgba(59,130,246,0.15)',
            color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer',
          }}
        >
          + 新增
        </button>
      </div>
      {ports.length === 0 && (
        <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', paddingBottom: 4 }}>（無欄位）</div>
      )}
      {ports.map((port, i) => (
        <div key={port.id} style={{ background: '#1e293b', borderRadius: 7, padding: '8px 10px', marginBottom: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PORT_TYPE_COLORS[port.dataType], flexShrink: 0 }} />
            <input
              value={port.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="名稱"
              style={inputStyle}
            />
            <select
              value={port.dataType}
              onChange={(e) => update(i, { dataType: e.target.value as PortDataType })}
              style={{ ...inputStyle, width: 'auto', flexShrink: 0, cursor: 'pointer' }}
            >
              {PORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={() => remove(i)}
              style={{
                background: 'transparent', border: 'none', color: '#ef4444',
                cursor: 'pointer', fontSize: 15, padding: '0 2px', flexShrink: 0,
              }}
              title="刪除"
            >
              ×
            </button>
          </div>
          <input
            value={port.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="說明（選填）"
            style={{ ...inputStyle, color: '#64748b', fontSize: 11 }}
          />
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 5, color: '#e2e8f0', padding: '4px 8px', fontSize: 12, outline: 'none', width: '100%',
};

interface Props {
  node: WorkflowNode;
  onUpdate: (node: WorkflowNode) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function NodeEditPanel({ node, onUpdate, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<WorkflowNode>(node);

  useEffect(() => { setDraft(node); }, [node.id]);

  const apply = (partial: Partial<WorkflowNode>) => {
    const updated = { ...draft, ...partial };
    setDraft(updated);
    onUpdate(updated);
  };

  return (
    <div
      style={{
        width: 320,
        height: '100%',
        background: '#111827',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>編輯節點</span>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: 5, width: 26, height: 26, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>節點標題</label>
          <input
            value={draft.title}
            onChange={(e) => apply({ title: e.target.value })}
            placeholder="輸入標題..."
            style={{ ...inputStyle, fontSize: 13 }}
          />
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>類別</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => apply({ category: cat })}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  border: `1px solid ${draft.category === cat ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`,
                  background: draft.category === cat ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: draft.category === cat ? '#93c5fd' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>說明</label>
          <textarea
            value={draft.description}
            onChange={(e) => apply({ description: e.target.value })}
            placeholder="描述此步驟的工作內容..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Input ports */}
        <PortEditor
          label="輸入 (Input)"
          ports={draft.inputs}
          onChange={(inputs) => apply({ inputs })}
        />

        {/* Output ports */}
        <PortEditor
          label="輸出 (Output)"
          ports={draft.outputs}
          onChange={(outputs) => apply({ outputs })}
        />
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => { if (confirm('確定要刪除此節點？')) onDelete(node.id); }}
          style={{
            width: '100%', padding: '8px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}
        >
          🗑 刪除節點
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
};

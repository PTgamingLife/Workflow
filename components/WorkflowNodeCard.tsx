'use client';

import React, { memo } from 'react';
import {
  WorkflowNode, CATEGORY_COLORS, CATEGORY_LABELS, PORT_TYPE_COLORS,
  NODE_W, HEADER_H, PORT_H, DESC_H, getNodeHeight,
} from '@/types/workflow';

interface Props {
  node: WorkflowNode;
  selected: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onPortMouseDown: (portId: string, portType: 'input' | 'output', e: React.MouseEvent) => void;
  onEdit: () => void;
  onClick: (e: React.MouseEvent) => void;
}

function WorkflowNodeCard({ node, selected, onDragStart, onPortMouseDown, onEdit, onClick }: Props) {
  const colors = CATEGORY_COLORS[node.category];
  const rows = Math.max(node.inputs.length, node.outputs.length, 1);
  const height = getNodeHeight(node);

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: NODE_W,
        height,
        borderRadius: 10,
        border: `1.5px solid ${selected ? '#60a5fa' : colors.border}`,
        background: '#161b27',
        boxShadow: selected
          ? `0 0 0 3px rgba(96,165,250,0.35), 0 4px 24px rgba(0,0,0,0.5)`
          : `0 0 0 0px transparent, 0 4px 16px rgba(0,0,0,0.4), 0 0 12px ${colors.glow}`,
        overflow: 'visible',
        userSelect: 'none',
        transition: 'box-shadow 0.15s ease',
        cursor: 'default',
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div
        style={{
          height: HEADER_H,
          background: colors.header,
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px 0 10px',
          gap: 6,
          cursor: 'grab',
        }}
        onMouseDown={onDragStart}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
            letterSpacing: 0.5,
            flexShrink: 0,
          }}
        >
          {CATEGORY_LABELS[node.category]}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={node.title}
        >
          {node.title}
        </span>
        <button
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 13,
            flexShrink: 0,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="編輯節點"
        >
          ✎
        </button>
      </div>

      {/* Ports */}
      <div style={{ position: 'relative', height: rows * PORT_H }}>
        {Array.from({ length: rows }, (_, i) => {
          const inp = node.inputs[i];
          const out = node.outputs[i];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: i * PORT_H,
                left: 0,
                right: 0,
                height: PORT_H,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {/* Input port */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 14 }}>
                {inp && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        left: -6,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: PORT_TYPE_COLORS[inp.dataType],
                        border: '2px solid #0d1117',
                        cursor: 'crosshair',
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(inp.id, 'input', e); }}
                      title={`${inp.name} (${inp.dataType})`}
                    />
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{inp.name}</span>
                  </>
                )}
              </div>

              {/* Output port */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 14 }}>
                {out && (
                  <>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>{out.name}</span>
                    <div
                      style={{
                        position: 'absolute',
                        right: -6,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: PORT_TYPE_COLORS[out.dataType],
                        border: '2px solid #0d1117',
                        cursor: 'crosshair',
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(out.id, 'output', e); }}
                      title={`${out.name} (${out.dataType})`}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Description */}
      {node.description && (
        <div
          style={{
            height: DESC_H,
            padding: '6px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11,
            color: '#64748b',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {node.description}
        </div>
      )}
    </div>
  );
}

export default memo(WorkflowNodeCard);

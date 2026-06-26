'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  WorkflowNode, Connection, PORT_TYPE_COLORS,
  NODE_W, HEADER_H, PORT_H, getNodeHeight,
} from '@/types/workflow';
import WorkflowNodeCard from './WorkflowNodeCard';

// --- helpers ---
function getPortCanvasPos(node: WorkflowNode, portId: string, portType: 'input' | 'output') {
  if (portType === 'input') {
    const idx = node.inputs.findIndex((p) => p.id === portId);
    return { x: node.position.x, y: node.position.y + HEADER_H + idx * PORT_H + PORT_H / 2 };
  } else {
    const idx = node.outputs.findIndex((p) => p.id === portId);
    return { x: node.position.x + NODE_W, y: node.position.y + HEADER_H + idx * PORT_H + PORT_H / 2 };
  }
}

function bezier(sx: number, sy: number, tx: number, ty: number) {
  const cx = Math.abs(tx - sx) * 0.55 + 30;
  return `M${sx},${sy} C${sx + cx},${sy} ${tx - cx},${ty} ${tx},${ty}`;
}

function findPortAt(nodes: WorkflowNode[], cx: number, cy: number, tol = 14) {
  for (const node of nodes) {
    for (let i = 0; i < node.inputs.length; i++) {
      const pos = { x: node.position.x, y: node.position.y + HEADER_H + i * PORT_H + PORT_H / 2 };
      if (Math.abs(cx - pos.x) < tol && Math.abs(cy - pos.y) < tol) {
        return { nodeId: node.id, portId: node.inputs[i].id, portType: 'input' as const };
      }
    }
    for (let i = 0; i < node.outputs.length; i++) {
      const pos = { x: node.position.x + NODE_W, y: node.position.y + HEADER_H + i * PORT_H + PORT_H / 2 };
      if (Math.abs(cx - pos.x) < tol && Math.abs(cy - pos.y) < tol) {
        return { nodeId: node.id, portId: node.outputs[i].id, portType: 'output' as const };
      }
    }
  }
  return null;
}

// --- types ---
type DragState =
  | { kind: 'idle' }
  | { kind: 'node'; nodeId: string; nodeStart: { x: number; y: number }; mouseStart: { x: number; y: number } }
  | { kind: 'connect'; fromNodeId: string; fromPortId: string; fromPortType: 'input' | 'output'; current: { x: number; y: number } }
  | { kind: 'select'; start: { x: number; y: number }; current: { x: number; y: number } }
  | { kind: 'pan'; mouseStart: { x: number; y: number }; tStart: { x: number; y: number } };

interface Transform { x: number; y: number; scale: number }

interface Props {
  nodes: WorkflowNode[];
  connections: Connection[];
  selectedNodeIds: Set<string>;
  onMoveNode: (id: string, pos: { x: number; y: number }) => void;
  onAddConnection: (conn: Connection) => void;
  onDeleteConnection: (id: string) => void;
  onSelectNodes: (ids: Set<string>) => void;
  onEditNode: (id: string) => void;
}

export default function WorkflowCanvas({
  nodes, connections, selectedNodeIds,
  onMoveNode, onAddConnection, onDeleteConnection, onSelectNodes, onEditNode,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 80, y: 80, scale: 1 });
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  const [drag, setDrag] = useState<DragState>({ kind: 'idle' });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [hoveredConn, setHoveredConn] = useState<string | null>(null);

  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.scale,
      y: (clientY - rect.top - t.y) / t.scale,
    };
  }, []);

  // Wheel → zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform((t) => {
        const ns = Math.min(Math.max(t.scale * factor, 0.15), 3);
        return { scale: ns, x: mx - (mx - t.x) * (ns / t.scale), y: my - (my - t.y) * (ns / t.scale) };
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Space → pan cursor
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && e.target === document.body) { setSpaceHeld(true); e.preventDefault(); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      setDrag({ kind: 'pan', mouseStart: { x: e.clientX, y: e.clientY }, tStart: { x: transformRef.current.x, y: transformRef.current.y } });
      return;
    }
    if (e.button !== 0) return;
    const cp = toCanvas(e.clientX, e.clientY);
    const port = findPortAt(nodes, cp.x, cp.y);
    if (port) {
      setDrag({ kind: 'connect', fromNodeId: port.nodeId, fromPortId: port.portId, fromPortType: port.portType, current: cp });
      return;
    }
    if (!e.ctrlKey && !e.metaKey) onSelectNodes(new Set());
    setDrag({ kind: 'select', start: cp, current: cp });
  }, [spaceHeld, nodes, toCanvas, onSelectNodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag.kind === 'idle') return;
    if (drag.kind === 'pan') {
      const dx = e.clientX - drag.mouseStart.x;
      const dy = e.clientY - drag.mouseStart.y;
      setTransform((t) => ({ ...t, x: drag.tStart.x + dx, y: drag.tStart.y + dy }));
    } else if (drag.kind === 'node') {
      const cp = toCanvas(e.clientX, e.clientY);
      const nx = Math.round((drag.nodeStart.x + cp.x - drag.mouseStart.x) / 20) * 20;
      const ny = Math.round((drag.nodeStart.y + cp.y - drag.mouseStart.y) / 20) * 20;
      onMoveNode(drag.nodeId, { x: Math.max(0, nx), y: Math.max(0, ny) });
    } else if (drag.kind === 'connect' || drag.kind === 'select') {
      const cp = toCanvas(e.clientX, e.clientY);
      setDrag((d) => d.kind === 'connect' || d.kind === 'select' ? { ...d, current: cp } : d);
    }
  }, [drag, toCanvas, onMoveNode]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.kind === 'connect') {
      const cp = toCanvas(e.clientX, e.clientY);
      const port = findPortAt(nodes, cp.x, cp.y);
      if (port && port.nodeId !== drag.fromNodeId && port.portType !== drag.fromPortType) {
        const [srcNodeId, srcPortId, tgtNodeId, tgtPortId] =
          drag.fromPortType === 'output'
            ? [drag.fromNodeId, drag.fromPortId, port.nodeId, port.portId]
            : [port.nodeId, port.portId, drag.fromNodeId, drag.fromPortId];
        onAddConnection({ id: `c${Date.now()}`, sourceNodeId: srcNodeId, sourcePortId: srcPortId, targetNodeId: tgtNodeId, targetPortId: tgtPortId });
      }
    } else if (drag.kind === 'select') {
      const { start, current } = drag;
      const x0 = Math.min(start.x, current.x);
      const y0 = Math.min(start.y, current.y);
      const x1 = Math.max(start.x, current.x);
      const y1 = Math.max(start.y, current.y);
      if (x1 - x0 > 4 || y1 - y0 > 4) {
        const sel = new Set(
          nodes
            .filter((n) => {
              const nh = getNodeHeight(n);
              return n.position.x < x1 && n.position.x + NODE_W > x0 && n.position.y < y1 && n.position.y + nh > y0;
            })
            .map((n) => n.id)
        );
        if (e.ctrlKey || e.metaKey) {
          onSelectNodes(new Set([...selectedNodeIds, ...sel]));
        } else {
          onSelectNodes(sel);
        }
      }
    }
    setDrag({ kind: 'idle' });
  }, [drag, toCanvas, nodes, onAddConnection, onSelectNodes, selectedNodeIds]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId)!;
    const cp = toCanvas(e.clientX, e.clientY);
    setDrag({ kind: 'node', nodeId, nodeStart: { ...node.position }, mouseStart: cp });
    if (!selectedNodeIds.has(nodeId)) {
      onSelectNodes(new Set([nodeId]));
    }
  }, [nodes, toCanvas, selectedNodeIds, onSelectNodes]);

  const handlePortMouseDown = useCallback((nodeId: string, portId: string, portType: 'input' | 'output', e: React.MouseEvent) => {
    e.stopPropagation();
    const cp = toCanvas(e.clientX, e.clientY);
    setDrag({ kind: 'connect', fromNodeId: nodeId, fromPortId: portId, fromPortType: portType, current: cp });
  }, [toCanvas]);

  // Temp line during connection drag
  const tempLine = useMemo(() => {
    if (drag.kind !== 'connect') return null;
    const fromNode = nodes.find((n) => n.id === drag.fromNodeId);
    if (!fromNode) return null;
    const fp = getPortCanvasPos(fromNode, drag.fromPortId, drag.fromPortType);
    const { x: tx, y: ty } = drag.current;
    return drag.fromPortType === 'output'
      ? bezier(fp.x, fp.y, tx, ty)
      : bezier(tx, ty, fp.x, fp.y);
  }, [drag, nodes]);

  // Selection rect
  const selRect = useMemo(() => {
    if (drag.kind !== 'select') return null;
    return {
      x: Math.min(drag.start.x, drag.current.x),
      y: Math.min(drag.start.y, drag.current.y),
      w: Math.abs(drag.current.x - drag.start.x),
      h: Math.abs(drag.current.y - drag.start.y),
    };
  }, [drag]);

  // Sort nodes: selected on top
  const sortedNodes = useMemo(
    () => [...nodes].sort((a, b) => (selectedNodeIds.has(a.id) ? 1 : 0) - (selectedNodeIds.has(b.id) ? 1 : 0)),
    [nodes, selectedNodeIds]
  );

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#0d1117',
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        cursor: drag.kind === 'pan' ? 'grabbing' : spaceHeld ? 'grab' : drag.kind === 'connect' ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDrag({ kind: 'idle' })}
    >
      <div
        style={{
          position: 'absolute',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG layer: connections */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: 9000, height: 7000, overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {connections.map((conn) => {
            const srcNode = nodes.find((n) => n.id === conn.sourceNodeId);
            const tgtNode = nodes.find((n) => n.id === conn.targetNodeId);
            if (!srcNode || !tgtNode) return null;
            const srcPort = srcNode.outputs.find((p) => p.id === conn.sourcePortId);
            const s = getPortCanvasPos(srcNode, conn.sourcePortId, 'output');
            const t = getPortCanvasPos(tgtNode, conn.targetPortId, 'input');
            const color = srcPort ? PORT_TYPE_COLORS[srcPort.dataType] : '#64748b';
            const isHovered = hoveredConn === conn.id;
            return (
              <g key={conn.id} style={{ pointerEvents: 'stroke' }}>
                {/* Transparent wide hit area */}
                <path
                  d={bezier(s.x, s.y, t.x, t.y)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredConn(conn.id)}
                  onMouseLeave={() => setHoveredConn(null)}
                  onClick={(e) => { e.stopPropagation(); onDeleteConnection(conn.id); }}
                />
                <path
                  d={bezier(s.x, s.y, t.x, t.y)}
                  fill="none"
                  stroke={isHovered ? '#ef4444' : color}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeOpacity={isHovered ? 1 : 0.7}
                  filter={isHovered ? undefined : 'url(#glow)'}
                  style={{ pointerEvents: 'none', transition: 'stroke 0.15s, stroke-width 0.15s' }}
                />
                {/* Port dots on endpoints */}
                <circle cx={s.x} cy={s.y} r={4} fill={color} />
                <circle cx={t.x} cy={t.y} r={4} fill={color} />
              </g>
            );
          })}

          {/* Temp connection while dragging */}
          {tempLine && (
            <path
              d={tempLine}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="6 3"
              opacity={0.8}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Selection rect */}
          {selRect && (
            <rect
              x={selRect.x} y={selRect.y} width={selRect.w} height={selRect.h}
              fill="rgba(59,130,246,0.08)"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="5 3"
            />
          )}
        </svg>

        {/* Node cards */}
        {sortedNodes.map((node) => (
          <WorkflowNodeCard
            key={node.id}
            node={node}
            selected={selectedNodeIds.has(node.id)}
            onDragStart={(e) => handleNodeDragStart(node.id, e)}
            onPortMouseDown={(portId, portType, e) => handlePortMouseDown(node.id, portId, portType, e)}
            onEdit={() => onEditNode(node.id)}
            onClick={(e) => {
              e.stopPropagation();
              if (e.ctrlKey || e.metaKey) {
                const ns = new Set(selectedNodeIds);
                if (ns.has(node.id)) ns.delete(node.id); else ns.add(node.id);
                onSelectNodes(ns);
              } else {
                onSelectNodes(new Set([node.id]));
              }
            }}
          />
        ))}
      </div>

      {/* Hint label */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: '#334155', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        拖曳節點移動 · 從輸出埠拖向輸入埠建立連接 · Ctrl+滾輪縮放 · 空白鍵+拖曳平移 · 點選連接線刪除
      </div>
    </div>
  );
}

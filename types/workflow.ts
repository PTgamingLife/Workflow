export type PortDataType =
  | 'any' | 'text' | 'number' | 'boolean'
  | 'file' | 'image' | 'json' | 'trigger' | 'array';

export interface Port {
  id: string;
  name: string;
  dataType: PortDataType;
  description: string;
}

export type NodeCategory =
  | 'trigger' | 'input' | 'process' | 'ai'
  | 'decision' | 'output' | 'storage' | 'manual';

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: '觸發',
  input: '輸入',
  process: '處理',
  ai: 'AI',
  decision: '判斷',
  output: '輸出',
  storage: '儲存',
  manual: '手動',
};

export const CATEGORY_COLORS: Record<
  NodeCategory,
  { header: string; border: string; glow: string }
> = {
  trigger:  { header: '#7c3aed', border: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
  input:    { header: '#1d4ed8', border: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  process:  { header: '#0e7490', border: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  ai:       { header: '#6d28d9', border: '#a78bfa', glow: 'rgba(167,139,250,0.35)' },
  decision: { header: '#b45309', border: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  output:   { header: '#065f46', border: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  storage:  { header: '#334155', border: '#64748b', glow: 'rgba(100,116,139,0.3)' },
  manual:   { header: '#9f1239', border: '#f43f5e', glow: 'rgba(244,63,94,0.3)' },
};

export const PORT_TYPE_COLORS: Record<PortDataType, string> = {
  any:     '#94a3b8',
  text:    '#60a5fa',
  number:  '#34d399',
  boolean: '#fbbf24',
  file:    '#a78bfa',
  image:   '#f472b6',
  json:    '#22d3ee',
  trigger: '#ef4444',
  array:   '#fb923c',
};

export interface WorkflowNode {
  id: string;
  title: string;
  description: string;
  category: NodeCategory;
  inputs: Port[];
  outputs: Port[];
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  connections: Connection[];
}

// Layout constants (shared between canvas and node card)
export const NODE_W = 240;
export const HEADER_H = 44;
export const PORT_H = 32;
export const DESC_H = 52;

export function getNodeHeight(node: WorkflowNode) {
  const rows = Math.max(node.inputs.length, node.outputs.length, 1);
  return HEADER_H + rows * PORT_H + (node.description ? DESC_H : 8);
}

export function getInputPortPos(node: WorkflowNode, portIdx: number) {
  return {
    x: node.position.x,
    y: node.position.y + HEADER_H + portIdx * PORT_H + PORT_H / 2,
  };
}

export function getOutputPortPos(node: WorkflowNode, portIdx: number) {
  return {
    x: node.position.x + NODE_W,
    y: node.position.y + HEADER_H + portIdx * PORT_H + PORT_H / 2,
  };
}

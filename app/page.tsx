'use client';

import { useState, useCallback, useEffect } from 'react';
import { WorkflowNode, Connection, NodeCategory } from '@/types/workflow';
import WorkflowCanvas from '@/components/WorkflowCanvas';
import NodeEditPanel from '@/components/NodeEditPanel';
import AIPanel from '@/components/AIPanel';
import Toolbar from '@/components/Toolbar';

// ---- initial demo workflow ----
const DEMO: { nodes: WorkflowNode[]; connections: Connection[] } = {
  nodes: [
    {
      id: 'n1', title: '客戶訂單', category: 'trigger',
      description: '客戶透過電商平台下訂單，觸發處理流程',
      position: { x: 40, y: 60 },
      inputs: [],
      outputs: [
        { id: 'n1o1', name: '訂單資料', dataType: 'json', description: '訂單 JSON 資料' },
        { id: 'n1o2', name: '客戶 Email', dataType: 'text', description: '' },
      ],
    },
    {
      id: 'n2', title: '驗證訂單', category: 'process',
      description: '檢查庫存、付款狀態、地址是否完整',
      position: { x: 360, y: 40 },
      inputs: [
        { id: 'n2i1', name: '訂單資料', dataType: 'json', description: '' },
      ],
      outputs: [
        { id: 'n2o1', name: '驗證結果', dataType: 'boolean', description: '' },
        { id: 'n2o2', name: '錯誤訊息', dataType: 'text', description: '' },
      ],
    },
    {
      id: 'n3', title: 'AI 分類客服需求', category: 'ai',
      description: '使用 LLM 分析訂單內容，預判客戶可能需求並生成優先回應策略',
      position: { x: 360, y: 220 },
      inputs: [
        { id: 'n3i1', name: '訂單資料', dataType: 'json', description: '' },
        { id: 'n3i2', name: '客戶 Email', dataType: 'text', description: '' },
      ],
      outputs: [
        { id: 'n3o1', name: '客服建議', dataType: 'text', description: '' },
        { id: 'n3o2', name: '優先等級', dataType: 'number', description: '' },
      ],
    },
    {
      id: 'n4', title: '通知倉儲備貨', category: 'output',
      description: '發送備貨指令給倉儲系統',
      position: { x: 680, y: 40 },
      inputs: [
        { id: 'n4i1', name: '驗證結果', dataType: 'boolean', description: '' },
        { id: 'n4i2', name: '訂單資料', dataType: 'json', description: '' },
      ],
      outputs: [
        { id: 'n4o1', name: '備貨單號', dataType: 'text', description: '' },
      ],
    },
    {
      id: 'n5', title: '儲存到資料庫', category: 'storage',
      description: '將訂單記錄寫入 CRM 資料庫',
      position: { x: 680, y: 220 },
      inputs: [
        { id: 'n5i1', name: '訂單資料', dataType: 'json', description: '' },
        { id: 'n5i2', name: '客服建議', dataType: 'text', description: '' },
      ],
      outputs: [
        { id: 'n5o1', name: '記錄 ID', dataType: 'text', description: '' },
      ],
    },
    {
      id: 'n6', title: '發送確認 Email', category: 'output',
      description: '根據 AI 建議生成個人化確認信',
      position: { x: 960, y: 130 },
      inputs: [
        { id: 'n6i1', name: '客戶 Email', dataType: 'text', description: '' },
        { id: 'n6i2', name: '備貨單號', dataType: 'text', description: '' },
        { id: 'n6i3', name: '客服建議', dataType: 'text', description: '' },
      ],
      outputs: [
        { id: 'n6o1', name: '發送狀態', dataType: 'boolean', description: '' },
      ],
    },
  ],
  connections: [
    { id: 'c1', sourceNodeId: 'n1', sourcePortId: 'n1o1', targetNodeId: 'n2', targetPortId: 'n2i1' },
    { id: 'c2', sourceNodeId: 'n1', sourcePortId: 'n1o1', targetNodeId: 'n3', targetPortId: 'n3i1' },
    { id: 'c3', sourceNodeId: 'n1', sourcePortId: 'n1o2', targetNodeId: 'n3', targetPortId: 'n3i2' },
    { id: 'c4', sourceNodeId: 'n2', sourcePortId: 'n2o1', targetNodeId: 'n4', targetPortId: 'n4i1' },
    { id: 'c5', sourceNodeId: 'n1', sourcePortId: 'n1o1', targetNodeId: 'n4', targetPortId: 'n4i2' },
    { id: 'c6', sourceNodeId: 'n1', sourcePortId: 'n1o1', targetNodeId: 'n5', targetPortId: 'n5i1' },
    { id: 'c7', sourceNodeId: 'n3', sourcePortId: 'n3o1', targetNodeId: 'n5', targetPortId: 'n5i2' },
    { id: 'c8', sourceNodeId: 'n1', sourcePortId: 'n1o2', targetNodeId: 'n6', targetPortId: 'n6i1' },
    { id: 'c9', sourceNodeId: 'n4', sourcePortId: 'n4o1', targetNodeId: 'n6', targetPortId: 'n6i2' },
    { id: 'c10', sourceNodeId: 'n3', sourcePortId: 'n3o1', targetNodeId: 'n6', targetPortId: 'n6i3' },
  ],
};

function uid() { return `n${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

function newNode(category: NodeCategory): WorkflowNode {
  const titles: Record<NodeCategory, string> = {
    trigger: '新觸發點', input: '新輸入', process: '新處理步驟',
    ai: '新 AI 步驟', decision: '新判斷', output: '新輸出',
    storage: '新儲存', manual: '新手動步驟',
  };
  return {
    id: uid(),
    title: titles[category],
    description: '',
    category,
    inputs: [{ id: uid(), name: '輸入', dataType: 'any', description: '' }],
    outputs: [{ id: uid(), name: '輸出', dataType: 'any', description: '' }],
    position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 },
  };
}

export default function Page() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEMO.nodes);
  const [connections, setConnections] = useState<Connection[]>(DEMO.connections);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load saved API key
  useEffect(() => {
    const k = localStorage.getItem('wf_api_key') || '';
    setApiKey(k);
  }, []);

  const handleApiKeyChange = useCallback((k: string) => {
    setApiKey(k);
    localStorage.setItem('wf_api_key', k);
  }, []);

  const handleMoveNode = useCallback((id: string, pos: { x: number; y: number }) => {
    setNodes((ns) => ns.map((n) => n.id === id ? { ...n, position: pos } : n));
  }, []);

  const handleUpdateNode = useCallback((updated: WorkflowNode) => {
    setNodes((ns) => ns.map((n) => n.id === updated.id ? updated : n));
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setConnections((cs) => cs.filter((c) => c.sourceNodeId !== id && c.targetNodeId !== id));
    setSelectedIds((ids) => { const s = new Set(ids); s.delete(id); return s; });
    setEditingId(null);
  }, []);

  const handleAddNode = useCallback((category: NodeCategory) => {
    const n = newNode(category);
    setNodes((ns) => [...ns, n]);
    setSelectedIds(new Set([n.id]));
    setEditingId(n.id);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setNodes((ns) => ns.filter((n) => !selectedIds.has(n.id)));
    setConnections((cs) => cs.filter((c) => !selectedIds.has(c.sourceNodeId) && !selectedIds.has(c.targetNodeId)));
    setSelectedIds(new Set());
    if (editingId && selectedIds.has(editingId)) setEditingId(null);
  }, [selectedIds, editingId]);

  const handleAnalyze = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!apiKey) {
      alert('請先在設定中輸入 Anthropic API Key');
      return;
    }
    const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const relatedConns = connections.filter(
      (c) => selectedNodeIds.has(c.sourceNodeId) && selectedNodeIds.has(c.targetNodeId)
    );
    setIsAnalyzing(true);
    setAiContent('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: { nodes: selectedNodes, connections: relatedConns }, apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiContent(data.result);
    } catch (err) {
      setAiContent(`**錯誤：** ${err instanceof Error ? err.message : '未知錯誤'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedIds, nodes, connections, apiKey]);

  const handleSave = useCallback(() => {
    localStorage.setItem('wf_data', JSON.stringify({ nodes, connections }));
    alert('已儲存到瀏覽器本機儲存空間');
  }, [nodes, connections]);

  const handleLoad = useCallback(() => {
    const raw = localStorage.getItem('wf_data');
    if (!raw) { alert('沒有找到已儲存的工作流程'); return; }
    try {
      const data = JSON.parse(raw);
      setNodes(data.nodes || []);
      setConnections(data.connections || []);
      setSelectedIds(new Set());
      setEditingId(null);
    } catch { alert('載入失敗，資料格式錯誤'); }
  }, []);

  const handleExportMarkdown = useCallback(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const portMap = new Map<string, string>();
    nodes.forEach((n) => {
      n.inputs.forEach((p) => portMap.set(p.id, p.name));
      n.outputs.forEach((p) => portMap.set(p.id, p.name));
    });

    const categoryLabel: Record<string, string> = {
      trigger: '觸發', input: '輸入', process: '處理', ai: 'AI',
      decision: '判斷', output: '輸出', storage: '儲存', manual: '手動',
    };

    const lines: string[] = [];
    const now = new Date().toLocaleString('zh-TW', { hour12: false });

    lines.push(`# 工作流程文件`);
    lines.push(`\n> 匯出時間：${now}　｜　節點：${nodes.length}　｜　連接：${connections.length}`);
    lines.push('');

    lines.push('## 流程圖');
    lines.push('');
    lines.push('```mermaid');
    lines.push('flowchart LR');
    nodes.forEach((n) => {
      const label = n.title.replace(/"/g, "'");
      lines.push(`  ${n.id}["${label}"]`);
    });
    connections.forEach((c) => {
      const srcPort = portMap.get(c.sourcePortId) ?? '';
      const tgtPort = portMap.get(c.targetPortId) ?? '';
      const edgeLabel = srcPort && tgtPort ? `|${srcPort} → ${tgtPort}|` : '';
      lines.push(`  ${c.sourceNodeId} -->${edgeLabel} ${c.targetNodeId}`);
    });
    lines.push('```');
    lines.push('');

    lines.push('## 節點詳情');
    lines.push('');
    nodes.forEach((n, i) => {
      lines.push(`### ${i + 1}. ${n.title}`);
      lines.push('');
      lines.push(`| 欄位 | 內容 |`);
      lines.push(`|------|------|`);
      lines.push(`| 類別 | ${categoryLabel[n.category] ?? n.category} |`);
      if (n.description) lines.push(`| 說明 | ${n.description.replace(/\n/g, ' ')} |`);
      lines.push('');

      if (n.inputs.length > 0) {
        lines.push('**輸入埠**');
        lines.push('');
        lines.push('| 名稱 | 資料型態 | 說明 |');
        lines.push('|------|----------|------|');
        n.inputs.forEach((p) => lines.push(`| ${p.name} | \`${p.dataType}\` | ${p.description || '—'} |`));
        lines.push('');
      }

      if (n.outputs.length > 0) {
        lines.push('**輸出埠**');
        lines.push('');
        lines.push('| 名稱 | 資料型態 | 說明 |');
        lines.push('|------|----------|------|');
        n.outputs.forEach((p) => lines.push(`| ${p.name} | \`${p.dataType}\` | ${p.description || '—'} |`));
        lines.push('');
      }
    });

    lines.push('## 連接清單');
    lines.push('');
    lines.push('| 來源節點 | 輸出埠 | 目標節點 | 輸入埠 |');
    lines.push('|----------|--------|----------|--------|');
    connections.forEach((c) => {
      const src = nodeMap.get(c.sourceNodeId)?.title ?? c.sourceNodeId;
      const tgt = nodeMap.get(c.targetNodeId)?.title ?? c.targetNodeId;
      const srcPort = portMap.get(c.sourcePortId) ?? c.sourcePortId;
      const tgtPort = portMap.get(c.targetPortId) ?? c.targetPortId;
      lines.push(`| ${src} | ${srcPort} | ${tgt} | ${tgtPort} |`);
    });
    lines.push('');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections]);

  const editingNode = editingId ? nodes.find((n) => n.id === editingId) ?? null : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toolbar
        selectedCount={selectedIds.size}
        nodeCount={nodes.length}
        connectionCount={connections.length}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        onAddNode={handleAddNode}
        onDeleteSelected={handleDeleteSelected}
        onAnalyze={handleAnalyze}
        onClear={() => { setNodes([]); setConnections([]); setSelectedIds(new Set()); setEditingId(null); }}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportMarkdown={handleExportMarkdown}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            selectedNodeIds={selectedIds}
            onMoveNode={handleMoveNode}
            onAddConnection={(conn) => setConnections((cs) => [...cs, conn])}
            onDeleteConnection={(id) => setConnections((cs) => cs.filter((c) => c.id !== id))}
            onSelectNodes={setSelectedIds}
            onEditNode={(id) => { setEditingId(id); setSelectedIds(new Set([id])); }}
          />

          {(aiContent !== null || isAnalyzing) && (
            <AIPanel
              content={aiContent ?? ''}
              isLoading={isAnalyzing}
              onClose={() => setAiContent(null)}
            />
          )}
        </div>

        {editingNode && (
          <NodeEditPanel
            node={editingNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onClose={() => setEditingId(null)}
          />
        )}
      </div>
    </div>
  );
}

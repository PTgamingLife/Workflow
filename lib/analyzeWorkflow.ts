import Anthropic from '@anthropic-ai/sdk';
import { WorkflowNode, Connection } from '@/types/workflow';

export async function analyzeWorkflow(
  nodes: WorkflowNode[],
  connections: Connection[],
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const workflowText = nodes
    .map((n) => {
      const inputs = n.inputs
        .map((p) => `  - ${p.name} (${p.dataType})${p.description ? ': ' + p.description : ''}`)
        .join('\n');
      const outputs = n.outputs
        .map((p) => `  - ${p.name} (${p.dataType})${p.description ? ': ' + p.description : ''}`)
        .join('\n');
      return `### ${n.title} [${n.category}]
說明: ${n.description || '無'}
輸入:\n${inputs || '  （無）'}
輸出:\n${outputs || '  （無）'}`;
    })
    .join('\n\n');

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const connectionText = connections
    .map((c) => {
      const src = nodeMap.get(c.sourceNodeId);
      const tgt = nodeMap.get(c.targetNodeId);
      const srcPort = src?.outputs.find((p) => p.id === c.sourcePortId);
      const tgtPort = tgt?.inputs.find((p) => p.id === c.targetPortId);
      return `- [${src?.title}].${srcPort?.name} → [${tgt?.title}].${tgtPort?.name}`;
    })
    .join('\n');

  const prompt = `你是一位工作流程自動化與 AI 解決方案專家。以下是一個工作流程定義，請深入分析並提供具體的 AI 自動化建議。

## 工作流程節點

${workflowText}

## 資料流連接

${connectionText || '（節點間尚未建立連接）'}

---

請按照以下結構提供分析報告（使用繁體中文）：

## 1. 流程概述
簡短描述整個工作流程的目的與現況。

## 2. 各步驟分析
逐一分析每個節點，說明其現有做法的挑戰或痛點。

## 3. AI 自動化機會
標示出哪些步驟最適合引入 AI 自動化，並說明理由（按優先順序排列）。

## 4. 推薦工具與方案
針對每個可自動化的步驟，推薦具體的 AI 工具、API 或服務（如 Claude、GPT-4、Whisper、Stable Diffusion、n8n、Make.com、Zapier 等），並說明如何整合。

## 5. AI Agent 模組設計
描述如何將整個（或部分）流程封裝為一個 AI Agent 模組，包含：
- 模組的輸入/輸出介面設計
- 核心邏輯與決策點
- 建議的技術堆疊

## 6. 實作路線圖
提供分階段的實作建議（短期、中期、長期），讓團隊能逐步導入自動化。

## 7. 預期效益
量化估算自動化後可節省的時間、人力或成本比例。`;

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');
}

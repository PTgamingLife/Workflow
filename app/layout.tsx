import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Workflow AI — 工作流程 AI 分析工具',
  description: '用方格形式定義工作流程，並透過 AI 分析自動化可能性',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body style={{ background: '#0d1117', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

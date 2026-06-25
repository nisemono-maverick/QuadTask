import { useRef, useState } from 'react';
import { Download, Upload, Settings, AlertCircle } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Button } from './ui/Button';

export function SettingsView() {
  const { exportData, importData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `QuadTask_backup_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('数据已导出');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('导出失败：' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      const text = await file.text();
      await importData(text);
      setSuccess('数据导入成功');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('导入失败：' + (e instanceof Error ? e.message : '文件格式不正确'));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border-default px-6">
        <h1 className="text-lg font-semibold text-text-primary">设置</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-xl border border-border-default bg-bg-primary p-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-text-primary">数据备份</h2>
            </div>
            <p className="mb-4 text-sm text-text-secondary">
              您的数据存储在浏览器本地 IndexedDB 中。建议定期导出备份，以防浏览器清理数据。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                导出 JSON
              </Button>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                导入 JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                {success}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border-default bg-bg-primary p-6">
            <h2 className="mb-4 text-base font-semibold text-text-primary">关于 QuadTask</h2>
            <p className="text-sm text-text-secondary">
              QuadTask 是一款融合 Todo 清单与艾森豪威尔四象限的个人任务管理工具。
              当前为 MVP 版本，数据完全存储在本地，无需网络即可使用。
            </p>
            <div className="mt-4 text-xs text-text-tertiary">
              版本 v0.1.0 · 基于 React + Vite + Dexie.js
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

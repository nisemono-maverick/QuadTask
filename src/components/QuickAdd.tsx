import { useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { cn } from '../utils';

export function QuickAdd({ className }: { className?: string }) {
  const [title, setTitle] = useState('');
  const { createTask, selectedListId } = useApp();

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask({
      title: trimmed,
      list_id: selectedListId === 'all' || selectedListId === 'today' || selectedListId === 'planned' || selectedListId === 'completed' || selectedListId === 'trash'
        ? null
        : selectedListId,
    });
    setTitle('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('flex items-center gap-2 rounded-xl border border-border-default bg-bg-primary px-4 py-3 shadow-sm', className)}>
      <Plus className="h-5 w-5 text-text-tertiary shrink-0" />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加任务..."
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none min-w-0"
      />
      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors md:px-3"
      >
        <span className="hidden md:inline">创建</span>
        <Plus className="h-4 w-4 md:hidden" />
      </button>
    </div>
  );
}

import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, Trash2, Plus } from 'lucide-react';
import type { TaskWithTags, Priority, SubTask } from '../types';
import { useApp } from '../hooks/useApp';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { DateTimeInput } from './ui/DateTimeInput';
import { Slider } from './ui/Slider';
import { Button } from './ui/Button';
import { getQuadrant, priorityToScores, MAX_SUBTASKS } from '../db/operations';
import { cn } from '../utils';
import { QUADRANT_CONFIG, PRIORITY_CONFIG } from '../constants';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task: TaskWithTags | null;
}

const emptyTask: Partial<TaskWithTags> = {
  title: '',
  description: '',
  start_date: null,
  due_date: null,
  priority: 'none',
  urgency: 5,
  importance: 5,
  list_id: null,
};

function formatDateTimeLocal(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskDialog({ open, onClose, task }: TaskDialogProps) {
  const { createTask, updateTask, setTaskTags, lists, tags, createDialogInitialDate } = useApp();
  const isEdit = !!task;
  const [form, setForm] = useState<Partial<TaskWithTags>>(emptyTask);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [quadrant, setQuadrant] = useState(getQuadrant(form.urgency || 5, form.importance || 5));

  useEffect(() => {
    if (open) {
      if (task) {
        setForm(task);
        setSelectedTagIds(task.tags?.map((t) => t.id) || []);
        setQuadrant(getQuadrant(task.urgency, task.importance));
      } else {
        setForm({
          ...emptyTask,
          due_date: createDialogInitialDate || null,
        });
        setSelectedTagIds([]);
        setQuadrant(getQuadrant(5, 5));
      }
    }
  }, [open, task, createDialogInitialDate]);

  const handleChange = <K extends keyof TaskWithTags>(key: K, value: TaskWithTags[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'priority' && typeof value === 'string') {
        const scores = priorityToScores(value as Priority);
        next.urgency = scores.urgency;
        next.importance = scores.importance;
      }
      if (key === 'urgency' || key === 'importance' || key === 'priority') {
        setQuadrant(getQuadrant(next.urgency || 5, next.importance || 5));
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const title = (form.title || '').trim();
    if (!title) return;

    const taskData = {
      title,
      description: form.description || '',
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      priority: (form.priority || 'none') as Priority,
      urgency: form.urgency || 5,
      importance: form.importance || 5,
      list_id: form.list_id || null,
    };

    if (isEdit && task) {
      await updateTask(task.id, taskData);
      await setTaskTags(task.id, selectedTagIds);
    } else {
      await createTask({ ...taskData, tags: selectedTagIds });
    }
    onClose();
  };

  const customLists = lists.filter((l) => l.type === 'custom');
  const qConfig = QUADRANT_CONFIG[quadrant];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑任务' : '新建任务'}
      description={isEdit ? '修改任务详情与优先级' : '创建一个新任务并自动映射到四象限'}
      className="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!(form.title || '').trim()}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="任务标题"
          placeholder="输入任务标题"
          value={form.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          autoFocus
        />

        <Textarea
          label="详细描述"
          value={form.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="添加备注（支持普通文本）"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <DateTimeInput
            label="开始时间"
            value={formatDateTimeLocal(form.start_date)}
            onChange={(e) => handleChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
          />

          <DateTimeInput
            label="结束时间"
            value={formatDateTimeLocal(form.due_date)}
            onChange={(e) => handleChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">优先级</label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low', 'none'] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const active = form.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleChange('priority', p)}
                  className={cn(
                    'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                    active ? 'border-primary bg-primary-light text-primary' : 'border-border-default text-text-secondary hover:bg-bg-tertiary'
                  )}
                >
                  <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: cfg.color }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Slider
            label="紧急程度"
            value={form.urgency || 5}
            onChange={(v) => handleChange('urgency', v)}
          />
          <Slider
            label="重要程度"
            value={form.importance || 5}
            onChange={(v) => handleChange('importance', v)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border-default bg-bg-secondary px-4 py-3">
          <span className="text-sm text-text-secondary">当前象限</span>
          <span className={cn('inline-flex items-center gap-2 text-sm font-semibold', qConfig.text)}>
            <span className={cn('h-3 w-3 rounded-full', qConfig.bg.replace('bg-', 'bg-'))} style={{ backgroundColor: 'currentColor' }} />
            {qConfig.label} {qConfig.subtitle}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="所属清单"
              value={form.list_id || ''}
              onChange={(v) => handleChange('list_id', v || null)}
              options={[
                { value: '', label: '所有任务' },
                ...customLists.map((list) => ({ value: list.id, label: list.name })),
              ]}
            />
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">标签</label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          selected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity',
                        selected ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                      )}
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isEdit && task && (
          <SubTaskEditor taskId={task.id} subTasks={task.sub_tasks || []} />
        )}
      </form>
    </Dialog>
  );
}

// Sub-task editor
function SubTaskEditor({ taskId, subTasks }: { taskId: string; subTasks: SubTask[] }) {
  const { createSubTask, toggleSubTask, updateSubTask, deleteSubTask } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const completedCount = subTasks.filter((st) => st.is_completed === 1).length;
  const canAdd = subTasks.length < MAX_SUBTASKS;

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title || !canAdd) return;
    await createSubTask(taskId, title);
    setNewTitle('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (st: SubTask) => {
    setEditingId(st.id);
    setEditTitle(st.title);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) return;
    await updateSubTask(editingId, { title });
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="rounded-lg border border-border-default bg-bg-secondary p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">子任务</span>
        <span className="text-xs text-text-secondary">
          {completedCount}/{subTasks.length} 已完成
        </span>
      </div>

      {subTasks.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {subTasks.map((st) => (
            <div
              key={st.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-2',
                st.is_completed === 1 && 'opacity-60'
              )}
            >
              <button
                type="button"
                onClick={() => toggleSubTask(st.id)}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  st.is_completed === 1
                    ? 'bg-success border-success text-text-primary'
                    : 'border-border-default hover:border-primary'
                )}
              >
                {st.is_completed === 1 && <Check className="h-3 w-3" />}
              </button>

              {editingId === st.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditTitle('');
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-border-default bg-bg-primary px-2 py-1 text-sm focus:border-border-focus focus:outline-none"
                />
              ) : (
                <span
                  onClick={() => startEdit(st)}
                  className={cn(
                    'min-w-0 flex-1 cursor-pointer truncate text-sm',
                    st.is_completed === 1 ? 'text-text-secondary line-through' : 'text-text-primary'
                  )}
                >
                  {st.title}
                </span>
              )}

              <button
                type="button"
                onClick={() => deleteSubTask(st.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-tertiary hover:text-danger hover:bg-danger/10 transition-opacity"
                title="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd ? (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="添加子任务，按回车确认"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {newTitle.trim() && (
            <button
              type="button"
              onClick={handleAdd}
              className="text-xs font-medium text-primary hover:text-primary-hover"
            >
              添加
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">已达到子任务上限（{MAX_SUBTASKS} 个）</p>
      )}
    </div>
  );
}

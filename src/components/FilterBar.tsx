import { useState } from 'react';
import { SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog } from './ui/Dialog';
import { cn } from '../utils';
import { PRIORITY_CONFIG, QUADRANT_CONFIG, PRESET_COLORS } from '../constants';
import type { Priority, Quadrant, SmartListFilter } from '../types';

export function FilterBar() {
  const {
    tags,
    filterTags,
    filterPriorities,
    filterStatus,
    filterDueDateFrom,
    filterDueDateTo,
    filterQuadrant,
    searchQuery,
    setFilterTags,
    setFilterPriorities,
    setFilterStatus,
    setFilterDueDateFrom,
    setFilterDueDateTo,
    setFilterQuadrant,
    clearFilters,
    createSmartList,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];

  filterTags.forEach((tagId) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      activeFilters.push({
        key: `tag-${tagId}`,
        label: `标签: ${tag.name}`,
        onRemove: () => setFilterTags(filterTags.filter((id) => id !== tagId)),
      });
    }
  });

  filterPriorities.forEach((p) => {
    activeFilters.push({
      key: `priority-${p}`,
      label: `优先级: ${PRIORITY_CONFIG[p].label}`,
      onRemove: () => setFilterPriorities(filterPriorities.filter((pr) => pr !== p)),
    });
  });

  if (filterStatus !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `状态: ${filterStatus === 'active' ? '未完成' : '已完成'}`,
      onRemove: () => setFilterStatus('all'),
    });
  }

  if (filterDueDateFrom || filterDueDateTo) {
    const from = filterDueDateFrom ? filterDueDateFrom.slice(0, 10) : '';
    const to = filterDueDateTo ? filterDueDateTo.slice(0, 10) : '';
    activeFilters.push({
      key: 'due-date',
      label: `截止: ${from && to ? `${from} 至 ${to}` : from ? `从 ${from}` : `至 ${to}`}`,
      onRemove: () => {
        setFilterDueDateFrom(null);
        setFilterDueDateTo(null);
      },
    });
  }

  if (filterQuadrant) {
    activeFilters.push({
      key: 'quadrant',
      label: `象限: ${QUADRANT_CONFIG[filterQuadrant].label}`,
      onRemove: () => setFilterQuadrant(null),
    });
  }

  const hasFilter =
    filterTags.length > 0 ||
    filterPriorities.length > 0 ||
    filterStatus !== 'all' ||
    filterDueDateFrom ||
    filterDueDateTo ||
    filterQuadrant ||
    searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
        筛选
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSaveOpen(true)}
        disabled={!hasFilter}
        title={hasFilter ? '保存当前筛选为智能清单' : '先添加筛选条件'}
      >
        <Sparkles className="mr-1.5 h-4 w-4" />
        保存为智能清单
      </Button>

      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-primary px-2.5 py-1 text-xs text-text-secondary"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="rounded-full p-0.5 hover:bg-bg-tertiary hover:text-text-primary"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {activeFilters.length > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          清除全部
        </button>
      )}

      <FilterDialog open={open} onClose={() => setOpen(false)} />
      <SaveSmartListDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        filter={{
          tags: filterTags.length > 0 ? filterTags : undefined,
          priorities: filterPriorities.length > 0 ? filterPriorities : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          dueDateFrom: filterDueDateFrom || undefined,
          dueDateTo: filterDueDateTo || undefined,
          quadrant: filterQuadrant || undefined,
          search: searchQuery || undefined,
        }}
        onSave={createSmartList}
      />
    </div>
  );
}

function SaveSmartListDialog({
  open,
  onClose,
  filter,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  filter: SmartListFilter;
  onSave: (name: string, filter: SmartListFilter, color?: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSave(trimmed, filter, color);
    setName('');
    setColor(PRESET_COLORS[0]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="保存为智能清单"
      description="将当前筛选条件保存为一个可重复使用的智能清单"
      className="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="智能清单名称"
          placeholder="例如：近期高优先级工作"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">颜色</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-all',
                  color === c ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function FilterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    tags,
    filterTags,
    filterPriorities,
    filterStatus,
    filterDueDateFrom,
    filterDueDateTo,
    filterQuadrant,
    setFilterTags,
    setFilterPriorities,
    setFilterStatus,
    setFilterDueDateFrom,
    setFilterDueDateTo,
    setFilterQuadrant,
    clearFilters,
  } = useApp();

  const toggleTag = (tagId: string) => {
    setFilterTags(filterTags.includes(tagId) ? filterTags.filter((id) => id !== tagId) : [...filterTags, tagId]);
  };

  const togglePriority = (p: Priority) => {
    setFilterPriorities(
      filterPriorities.includes(p) ? filterPriorities.filter((pr) => pr !== p) : [...filterPriorities, p]
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="筛选任务"
      description="组合多个条件过滤任务"
      className="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={clearFilters}>
            清除全部
          </Button>
          <Button onClick={onClose}>完成</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = filterTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-opacity',
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

        {/* Priority */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">优先级</label>
          <div className="flex flex-wrap gap-2">
            {(['high', 'medium', 'low', 'none'] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const selected = filterPriorities.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected ? 'border-primary bg-primary-light text-primary' : 'border-border-default text-text-secondary hover:bg-bg-tertiary'
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">完成状态</label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'completed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  filterStatus === s ? 'border-primary bg-primary-light text-primary' : 'border-border-default text-text-secondary hover:bg-bg-tertiary'
                )}
              >
                {s === 'all' ? '全部' : s === 'active' ? '未完成' : '已完成'}
              </button>
            ))}
          </div>
        </div>

        {/* Due date range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">截止日期范围</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-xs text-text-secondary">开始</span>
              <input
                type="date"
                value={filterDueDateFrom ? filterDueDateFrom.slice(0, 10) : ''}
                onChange={(e) => setFilterDueDateFrom(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-text-secondary">结束</span>
              <input
                type="date"
                value={filterDueDateTo ? filterDueDateTo.slice(0, 10) : ''}
                onChange={(e) => setFilterDueDateTo(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quadrant */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">象限</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as Quadrant[]).map((q) => {
              const cfg = QUADRANT_CONFIG[q];
              const selected = filterQuadrant === q;
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setFilterQuadrant(selected ? null : q)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors',
                    selected ? 'border-primary bg-primary-light text-primary' : 'border-border-default text-text-secondary hover:bg-bg-tertiary'
                  )}
                >
                  <span className="font-semibold">{cfg.label}</span>
                  <span className="ml-1 text-text-tertiary">{cfg.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

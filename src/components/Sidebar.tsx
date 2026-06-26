import { useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import {
  LayoutGrid,
  ListTodo,
  Settings,
  Plus,
  LayoutGrid as QuadrantIcon,
  CheckCircle2,
  CalendarDays,
  CalendarCheck,
  GanttChart,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { useApp } from '../hooks/useApp';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog } from './ui/Dialog';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { cn } from '../utils';
import { PRESET_COLORS } from '../constants';
import * as LucideIcons from 'lucide-react';
import type { Tag, ViewMode, List } from '../types';

type IconComponent = ComponentType<{ className?: string; style?: CSSProperties }>;

function DroppableListItem({
  list,
  active,
  children,
}: {
  list: List;
  active?: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { list },
    disabled: list.type !== 'custom',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/10'
      )}
    >
      {children}
    </div>
  );
}

const iconMap: Record<string, IconComponent> = {
  LayoutGrid,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Trash2,
  ListTodo,
};

function getIcon(name: string): IconComponent {
  return ((LucideIcons as unknown) as Record<string, IconComponent>)[name] || ListTodo;
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const {
    lists,
    tags,
    selectedListId,
    viewMode,
    selectList,
    setViewMode,
    createList,
    deleteList,
    createTag,
    updateTag,
    deleteTag,
  } = useApp();

  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState(PRESET_COLORS[0]);
  const [expandedLists, setExpandedLists] = useState(true);
  const [expandedSmartLists, setExpandedSmartLists] = useState(true);
  const [expandedTags, setExpandedTags] = useState(true);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});

  const openConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmDescription(description);
    setConfirmAction(() => onConfirm);
    setConfirmOpen(true);
  };

  const systemLists = lists.filter((l) => l.type === 'system');
  const customLists = lists.filter((l) => l.type === 'custom');
  const smartLists = lists.filter((l) => l.type === 'smart');

  const handleSelectList = (id: string) => {
    selectList(id);
    onClose?.();
  };

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    onClose?.();
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await createList(newListName.trim(), newListColor);
    setNewListName('');
    setNewListOpen(false);
  };

  const openCreateTag = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(PRESET_COLORS[0]);
    setTagDialogOpen(true);
  };

  const openEditTag = (tag: Tag) => {
    setEditingTag({ id: tag.id, name: tag.name, color: tag.color });
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagDialogOpen(true);
  };

  const closeTagDialog = () => {
    setTagDialogOpen(false);
    setEditingTag(null);
    setTagName('');
  };

  const handleSaveTag = async () => {
    const name = tagName.trim();
    if (!name) return;
    if (editingTag) {
      await updateTag(editingTag.id, { name, color: tagColor });
    } else {
      await createTag(name, tagColor);
    }
    closeTagDialog();
  };

  const NavItem = ({
    icon,
    label,
    count,
    active,
    onClick,
  }: {
    icon?: ReactNode;
    label: string;
    count?: number;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium',
            active ? 'bg-primary/10 text-primary' : 'bg-bg-tertiary text-text-tertiary'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border-default bg-bg-primary">
      <div className="flex h-14 items-center gap-2 border-b border-border-default px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-text-primary">QuadTask</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Views */}
        <div className="space-y-1">
          <NavItem
            label="四象限"
            icon={<QuadrantIcon className="h-4 w-4" />}
            active={viewMode === 'quadrants'}
            onClick={() => handleSetViewMode('quadrants')}
          />
          <NavItem
            label="清单视图"
            icon={<ListTodo className="h-4 w-4" />}
            active={viewMode === 'list' && selectedListId === 'all'}
            onClick={() => handleSelectList('all')}
          />
          <NavItem
            label="日历"
            icon={<CalendarDays className="h-4 w-4" />}
            active={viewMode === 'calendar'}
            onClick={() => handleSetViewMode('calendar')}
          />
          <NavItem
            label="甘特图"
            icon={<GanttChart className="h-4 w-4" />}
            active={viewMode === 'gantt'}
            onClick={() => handleSetViewMode('gantt')}
          />
        </div>

        {/* System Lists */}
        <div className="space-y-1">
          {systemLists.map((list) => {
            const Icon = iconMap[list.icon] || ListTodo;
            return (
              <NavItem
                key={list.id}
                label={list.name}
                icon={<Icon className="h-4 w-4" style={{ color: list.color }} />}
                active={viewMode === 'list' && selectedListId === list.id}
                onClick={() => handleSelectList(list.id)}
              />
            );
          })}
        </div>

        {/* Custom Lists */}
        <div>
          <button
            onClick={() => setExpandedLists(!expandedLists)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider"
          >
            <span>我的清单</span>
            {expandedLists ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {expandedLists && (
            <div className="mt-1 space-y-1">
              {customLists.map((list) => (
                <DroppableListItem
                  key={list.id}
                  list={list}
                  active={viewMode === 'list' && selectedListId === list.id}
                >
                  <button
                    onClick={() => handleSelectList(list.id)}
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    {(() => {
                      const Icon = getIcon(list.icon);
                      return <Icon className="h-4 w-4 shrink-0" style={{ color: list.color }} />;
                    })()}
                    <span className="truncate">{list.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfirm(
                        `删除清单 "${list.name}"`,
                        '其中的任务将移至“所有任务”，不会丢失。',
                        () => deleteList(list.id)
                      );
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </DroppableListItem>
              ))}
              <button
                onClick={() => setNewListOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
                新建清单
              </button>
            </div>
          )}
        </div>

        {/* Smart Lists */}
        {smartLists.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedSmartLists(!expandedSmartLists)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider"
            >
              <span>智能清单</span>
              {expandedSmartLists ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {expandedSmartLists && (
              <div className="mt-1 space-y-1">
                {smartLists.map((list) => (
                  <div
                    key={list.id}
                    className={cn(
                      'group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                      viewMode === 'list' && selectedListId === list.id
                        ? 'bg-primary-light text-primary'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    )}
                  >
                    <button onClick={() => handleSelectList(list.id)} className="flex flex-1 items-center gap-3 min-w-0">
                      <Sparkles className="h-4 w-4 shrink-0" style={{ color: list.color }} />
                      <span className="truncate">{list.name}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirm(
                          `删除智能清单 "${list.name}"`,
                          '智能清单只是筛选视图，删除后不会影响任务。',
                          () => deleteList(list.id)
                        );
                      }}
                      className="ml-1 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedTags(!expandedTags)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider"
            >
              <span>标签</span>
              {expandedTags ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {expandedTags && (
              <div className="mt-1 space-y-1">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    <button
                      onClick={() => openEditTag(tag)}
                      className="flex flex-1 items-center gap-3 min-w-0 text-left"
                      title="编辑标签"
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="truncate">{tag.name}</span>
                    </button>
                    <button
                      onClick={() => {
                        openConfirm(
                          `删除标签 "${tag.name}"`,
                          '标签将从所有关联任务中移除，任务本身不会被删除。',
                          () => deleteTag(tag.id)
                        );
                      }}
                      className="ml-1 opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={openCreateTag}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
        >
          <TagIcon className="h-4 w-4" />
          新建标签
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-border-default p-3">
        <NavItem
          label="设置"
          icon={<Settings className="h-4 w-4" />}
          active={viewMode === 'settings'}
          onClick={() => handleSetViewMode('settings')}
        />
      </div>

      {/* New List Dialog */}
      <Dialog
        open={newListOpen}
        onClose={() => setNewListOpen(false)}
        title="新建清单"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewListOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim()}>
              创建
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="清单名称"
            placeholder="例如：工作、个人、学习"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">颜色</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewListColor(color)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    newListColor === color ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog
        open={tagDialogOpen}
        onClose={closeTagDialog}
        title={editingTag ? '编辑标签' : '新建标签'}
        footer={
          <>
            <Button variant="ghost" onClick={closeTagDialog}>
              取消
            </Button>
            <Button onClick={handleSaveTag} disabled={!tagName.trim()}>
              {editingTag ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="标签名称"
            placeholder="例如：紧急、日常"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            autoFocus
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">颜色</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setTagColor(color)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    tagColor === color ? 'border-text-primary scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          confirmAction();
          setConfirmOpen(false);
        }}
        title={confirmTitle}
        description={confirmDescription}
      />
    </aside>
  );
}

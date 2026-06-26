import { useState } from 'react';
import { ClipboardList, Trash2, RotateCcw, CheckCircle2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../hooks/useApp';
import { TaskCard } from './TaskCard';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { VirtualList } from './VirtualList';
import { cn } from '../utils';
import type { TaskWithTags } from '../types';

function TaskItem({
  task,
  isTrash,
  dragHandle,
  onToggle,
  onClick,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  task: TaskWithTags;
  isTrash: boolean;
  dragHandle?: React.ReactNode;
  onToggle: (id: string) => void;
  onClick: (task: TaskWithTags) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-2">
      {dragHandle}
      <div className="flex-1">
        <TaskCard task={task} onToggle={onToggle} onClick={onClick} />
      </div>
      {isTrash ? (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" onClick={() => onRestore(task.id)} title="恢复">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onPermanentDelete(task.id)}
            title="永久删除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-opacity"
          title="删除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function SortableTaskItem({
  task,
  isTrash,
  onToggle,
  onClick,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  task: TaskWithTags;
  isTrash: boolean;
  onToggle: (id: string) => void;
  onClick: (task: TaskWithTags) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('rounded-lg', isDragging && 'opacity-50')}>
      <TaskItem
        task={task}
        isTrash={isTrash}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-text-tertiary hover:text-text-secondary active:cursor-grabbing"
            title="拖拽排序"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
        onToggle={onToggle}
        onClick={onClick}
        onDelete={onDelete}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
      />
    </div>
  );
}

export function TaskList() {
  const {
    tasks,
    lists,
    selectedListId,
    loading,
    toggleComplete,
    openEditDialog,
    deleteTask,
    restoreTask,
    permanentDelete,
    emptyTrash,
    reorderTasks,
  } = useApp();

  const selectedList = lists.find((l) => l.id === selectedListId);
  const isTrash = selectedListId === 'trash';
  const isCompletedList = selectedListId === 'completed';

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

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const activeCount = tasks.filter((t) => t.status !== 'completed').length;

  // 普通清单（非回收站、非已完成清单）分组展示：未完成的任务在上，已完成的任务在下
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => {
      if (!a.completed_at && !b.completed_at) return 0;
      if (!a.completed_at) return 1;
      if (!b.completed_at) return -1;
      return b.completed_at.localeCompare(a.completed_at);
    });

  const showGrouped = !isTrash && !isCompletedList;
  const enableSort = showGrouped && activeTasks.length > 1;

  // 已完成任务数量大时启用虚拟滚动阈值
  const COMPLETED_VIRTUAL_THRESHOLD = 100;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    await reorderTasks(reordered.map((t) => t.id));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-border-default px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-text-primary">{selectedList?.name || '所有任务'}</h1>
          {!isTrash && (
            <span className="text-sm text-text-secondary">
              {activeCount} 待办 · {completedCount} 已完成
            </span>
          )}
        </div>
        {isTrash && tasks.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              openConfirm('清空回收站', '回收站中的任务将被永久删除，此操作不可撤销。', () => emptyTrash())
            }
          >
            <Trash2 className="mr-1 h-4 w-4" />
            清空回收站
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-text-tertiary">
            <ClipboardList className="mb-4 h-16 w-16 opacity-30" />
            <p className="text-base font-medium">
              {isTrash ? '回收站是空的' : isCompletedList ? '还没有已完成的任务' : '暂无任务'}
            </p>
            <p className="mt-1 text-sm">
              {isTrash ? '删除的任务会在这里保留 30 天' : '点击上方输入框创建一个新任务'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {showGrouped ? (
              <>
                {/* 未完成任务 - 可拖拽排序 */}
                {enableSort ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      {activeTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          isTrash={isTrash}
                          onToggle={toggleComplete}
                          onClick={openEditDialog}
                          onDelete={deleteTask}
                          onRestore={restoreTask}
                          onPermanentDelete={(id) => openConfirm('永久删除任务', '任务将被永久删除，无法恢复。', () => permanentDelete(id))}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isTrash={isTrash}
                      onToggle={toggleComplete}
                      onClick={openEditDialog}
                      onDelete={deleteTask}
                      onRestore={restoreTask}
                      onPermanentDelete={(id) => openConfirm('永久删除任务', '任务将被永久删除，无法恢复。', () => permanentDelete(id))}
                    />
                  ))
                )}

                {/* 已完成分组 */}
                {completedTasks.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 pb-2 pt-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm font-semibold text-text-secondary">已完成</span>
                      <span className="text-xs text-text-tertiary">{completedTasks.length}</span>
                    </div>
                    {completedTasks.length > COMPLETED_VIRTUAL_THRESHOLD ? (
                      <VirtualList
                        items={completedTasks}
                        estimateSize={68}
                        className="max-h-[600px]"
                        renderItem={(task) => (
                          <TaskItem
                            task={task}
                            isTrash={isTrash}
                            onToggle={toggleComplete}
                            onClick={openEditDialog}
                            onDelete={deleteTask}
                            onRestore={restoreTask}
                            onPermanentDelete={(id) => openConfirm('永久删除任务', '任务将被永久删除，无法恢复。', () => permanentDelete(id))}
                          />
                        )}
                      />
                    ) : (
                      <div className="space-y-2">
                        {completedTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            isTrash={isTrash}
                            onToggle={toggleComplete}
                            onClick={openEditDialog}
                            onDelete={deleteTask}
                            onRestore={restoreTask}
                            onPermanentDelete={(id) => openConfirm('永久删除任务', '任务将被永久删除，无法恢复。', () => permanentDelete(id))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // 回收站 / 已完成清单：平铺展示
              tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isTrash={isTrash}
                  onToggle={toggleComplete}
                  onClick={openEditDialog}
                  onDelete={deleteTask}
                  onRestore={restoreTask}
                  onPermanentDelete={(id) => openConfirm('永久删除任务', '任务将被永久删除，无法恢复。', () => permanentDelete(id))}
                />
              ))
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { useApp } from '../hooks/useApp';
import type { TaskWithTags, Quadrant } from '../types';
import { getQuadrant } from '../db/operations';
import { QUADRANT_CONFIG } from '../constants';
import { cn } from '../utils';

interface DraggableTaskCardProps {
  task: TaskWithTags;
}

function DraggableTaskCard({ task }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const { openEditDialog, toggleComplete, deleteTask } = useApp();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <TaskCard
        task={task}
        onToggle={toggleComplete}
        onClick={openEditDialog}
        onDelete={deleteTask}
        dragging={isDragging}
      />
    </div>
  );
}

interface QuadrantDropZoneProps {
  quadrant: Quadrant;
  tasks: TaskWithTags[];
  activeQuadrant: Quadrant | null;
}

function QuadrantDropZone({ quadrant, tasks, activeQuadrant }: QuadrantDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: quadrant,
    data: { quadrant },
  });

  const config = QUADRANT_CONFIG[quadrant];
  const highlighted = isOver || activeQuadrant === quadrant;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full flex-col rounded-xl bg-opacity-50 transition-all duration-200',
        config.bg,
        config.border,
        highlighted ? 'border-4' : 'border-2',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className="flex h-10 items-center justify-between border-b border-current border-opacity-20 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold', config.text)}>{config.label}</span>
          <span className={cn('text-xs', config.text)}>{config.subtitle}</span>
        </div>
        <span className={cn('rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium', config.text)}>
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 ? (
          <div className="flex h-24 items-center justify-center">
            <span className="text-xs text-text-tertiary">拖拽任务到此处</span>
          </div>
        ) : (
          tasks.map((task) => <DraggableTaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

export function QuadrantGrid() {
  const { tasks, loading, updateTask, toggleComplete, openEditDialog } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) || null : null;
  const activeQuadrant = activeTask ? getQuadrant(activeTask.urgency, activeTask.importance) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetQuadrant = over.id as Quadrant;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !['Q1', 'Q2', 'Q3', 'Q4'].includes(targetQuadrant)) return;

    const currentQuadrant = getQuadrant(task.urgency, task.importance);
    if (currentQuadrant === targetQuadrant) return;

    const config = QUADRANT_CONFIG[targetQuadrant];
    await updateTask(taskId, {
      urgency: config.suggestedUrgency,
      importance: config.suggestedImportance,
    });
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const q1Tasks = tasks.filter((t) => getQuadrant(t.urgency, t.importance) === 'Q1');
  const q2Tasks = tasks.filter((t) => getQuadrant(t.urgency, t.importance) === 'Q2');
  const q3Tasks = tasks.filter((t) => getQuadrant(t.urgency, t.importance) === 'Q3');
  const q4Tasks = tasks.filter((t) => getQuadrant(t.urgency, t.importance) === 'Q4');

  // Sort by importance * urgency descending
  const sortTasks = (list: TaskWithTags[]) =>
    [...list].sort((a, b) => b.importance * b.urgency - a.importance * a.urgency);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border-default px-6">
          <h1 className="text-lg font-semibold text-text-primary">四象限</h1>
          <span className="text-sm text-text-secondary">
            {tasks.filter((t) => t.status !== 'completed').length} 待办 · {tasks.filter((t) => t.status === 'completed').length} 已完成
          </span>
        </div>
        <div className="flex-1 p-4">
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-2 overflow-y-auto md:overflow-visible">
            <QuadrantDropZone quadrant="Q2" tasks={sortTasks(q2Tasks)} activeQuadrant={activeQuadrant} />
            <QuadrantDropZone quadrant="Q1" tasks={sortTasks(q1Tasks)} activeQuadrant={activeQuadrant} />
            <QuadrantDropZone quadrant="Q4" tasks={sortTasks(q4Tasks)} activeQuadrant={activeQuadrant} />
            <QuadrantDropZone quadrant="Q3" tasks={sortTasks(q3Tasks)} activeQuadrant={activeQuadrant} />
          </div>
        </div>
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onToggle={toggleComplete}
            onClick={openEditDialog}
            dragging
            className="rotate-2 cursor-grabbing"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

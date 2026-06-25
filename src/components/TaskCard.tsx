import { Calendar, Check, Trash2, ListChecks } from 'lucide-react';
import type { TaskWithTags } from '../types';
import { cn, formatDateRange, isOverdue } from '../utils';
import { PRIORITY_CONFIG } from '../constants';

interface TaskCardProps {
  task: TaskWithTags;
  onToggle: (id: string) => void;
  onClick: (task: TaskWithTags) => void;
  onDelete?: (id: string) => void;
  className?: string;
  dragging?: boolean;
}

export function TaskCard({ task, onToggle, onClick, onDelete, className, dragging }: TaskCardProps) {
  const completed = task.status === 'completed';
  const overdue = isOverdue(task.due_date, completed);
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        'group relative flex items-start gap-3 rounded-lg border bg-bg-primary p-3 shadow-sm cursor-pointer transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-primary',
        completed && 'opacity-60',
        overdue && 'border-l-4 border-l-danger border-l-solid',
        dragging && 'opacity-85 shadow-lg scale-[1.02]',
        className
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-200',
          completed
            ? 'bg-success border-success text-white'
            : 'border-border-default bg-bg-primary hover:border-primary'
        )}
      >
        {completed && <Check className="h-3.5 w-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium text-text-primary',
              completed && 'line-through text-text-secondary'
            )}
            title={task.title}
          >
            {task.title}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 -mr-1 -mt-1 p-1 rounded text-text-tertiary hover:text-danger hover:bg-danger/10 transition-opacity"
              title="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {(task.start_date || task.due_date) && (
            <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-danger font-medium' : 'text-text-secondary')}>
              <Calendar className="h-3 w-3" />
              {formatDateRange(task.start_date, task.due_date)}
              {overdue && task.due_date && ` (已过期 ${Math.max(1, Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)))} 天)`}
            </span>
          )}

          <span
            className="inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: priority.color }}
            title={`优先级: ${priority.label}`}
          />

          {task.tags && task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}

          {task.sub_tasks && task.sub_tasks.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <ListChecks className="h-3 w-3" />
              {task.sub_tasks.filter((st) => st.is_completed === 1).length}/{task.sub_tasks.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import {
  format,
  parseISO,
  startOfDay,
  differenceInDays,
  addDays,
  isToday,
  isWeekend,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarRange, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Select } from './ui/Select';
import { cn } from '../utils';
import { getQuadrant } from '../db/operations';
import type { TaskWithTags, Quadrant, Priority } from '../types';

type GanttSortMode = 'time' | 'priority' | 'quadrant' | 'list';

interface GanttTask extends TaskWithTags {
  start: Date;
  end: Date;
  quadrant: Quadrant;
}

const DAY_WIDTH = 48; // px per day
const ROW_HEIGHT = 44; // px per task row
const LIST_WIDTH = 220; // px for task list sidebar
const HEADER_HEIGHT = 56; // px for date header

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

const QUADRANT_ORDER: Record<Quadrant, number> = {
  Q1: 0,
  Q2: 1,
  Q3: 2,
  Q4: 3,
};

function normalizeTask(task: TaskWithTags): GanttTask | null {
  const start = task.start_date ? parseISO(task.start_date) : task.due_date ? parseISO(task.due_date) : null;
  const end = task.due_date ? parseISO(task.due_date) : task.start_date ? parseISO(task.start_date) : null;
  if (!start || !end) return null;
  return {
    ...task,
    start: startOfDay(start),
    end: startOfDay(end),
    quadrant: getQuadrant(task.urgency, task.importance),
  };
}

function sortTasks(tasks: GanttTask[], mode: GanttSortMode, lists: { id: string; sort_order: number }[]): GanttTask[] {
  const sorted = [...tasks];
  switch (mode) {
    case 'time':
      sorted.sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
      break;
    case 'priority':
      sorted.sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          a.start.getTime() - b.start.getTime()
      );
      break;
    case 'quadrant':
      sorted.sort(
        (a, b) =>
          QUADRANT_ORDER[a.quadrant] - QUADRANT_ORDER[b.quadrant] ||
          a.start.getTime() - b.start.getTime()
      );
      break;
    case 'list': {
      const orderMap = new Map(lists.map((l) => [l.id, l.sort_order]));
      sorted.sort(
        (a, b) =>
          (orderMap.get(a.list_id || '') ?? Infinity) - (orderMap.get(b.list_id || '') ?? Infinity) ||
          a.start.getTime() - b.start.getTime()
      );
      break;
    }
  }
  return sorted;
}

function getDateRange(tasks: GanttTask[]): { start: Date; end: Date; days: number } {
  if (tasks.length === 0) {
    const today = startOfDay(new Date());
    return { start: today, end: addDays(today, 13), days: 14 };
  }
  const start = startOfDay(new Date(Math.min(...tasks.map((t) => t.start.getTime()))));
  const end = startOfDay(new Date(Math.max(...tasks.map((t) => t.end.getTime()))));
  // Add padding: 2 days before and 5 days after
  const paddedStart = addDays(start, -2);
  const paddedEnd = addDays(end, 5);
  const days = differenceInDays(paddedEnd, paddedStart) + 1;
  return { start: paddedStart, end: paddedEnd, days };
}

export function GanttView() {
  const { tasks, lists, openEditDialog } = useApp();
  const [sortMode, setSortMode] = useState<GanttSortMode>('time');
  const scrollRef = useRef<HTMLDivElement>(null);

  const ganttTasks = useMemo(() => {
    return tasks.map(normalizeTask).filter(Boolean) as GanttTask[];
  }, [tasks]);

  const sortedTasks = useMemo(() => sortTasks(ganttTasks, sortMode, lists), [ganttTasks, sortMode, lists]);

  const { start: rangeStart, days: totalDays } = useMemo(() => getDateRange(ganttTasks), [ganttTasks]);

  const timelineWidth = Math.max(totalDays * DAY_WIDTH, 0);

  const dates = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));
  }, [rangeStart, totalDays]);

  const todayLineLeft = useMemo(() => {
    const today = startOfDay(new Date());
    const dayIndex = differenceInDays(today, rangeStart);
    if (dayIndex < 0 || dayIndex >= totalDays) return null;
    return dayIndex * DAY_WIDTH + DAY_WIDTH / 2;
  }, [rangeStart, totalDays]);

  function getTaskStyle(task: GanttTask) {
    const startIndex = differenceInDays(task.start, rangeStart);
    const duration = differenceInDays(task.end, task.start) + 1;
    const left = startIndex * DAY_WIDTH;
    const width = Math.max(duration * DAY_WIDTH - 4, DAY_WIDTH - 4);
    return { left, width };
  }

  return (
    <div className="flex h-full flex-col bg-bg-secondary">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border-default bg-bg-primary px-4 md:px-6">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold text-text-primary md:text-lg">甘特图</h1>
          <span className="text-xs text-text-tertiary">({sortedTasks.length} 个有时间段的任务)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-text-secondary md:inline">排序：</span>
          <Select
            value={sortMode}
            onChange={(v) => setSortMode(v as GanttSortMode)}
            options={[
              { value: 'time', label: '按开始时间' },
              { value: 'priority', label: '按优先级' },
              { value: 'quadrant', label: '按四象限' },
              { value: 'list', label: '按清单' },
            ]}
            size="sm"
          />
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-text-secondary">
          <AlertCircle className="h-10 w-10 text-text-tertiary" />
          <p className="text-sm">当前没有带有开始/截止时间的任务</p>
          <p className="text-xs text-text-tertiary">在任务编辑中设置时间段后，即可在甘特图中查看</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Task list sidebar */}
          <div
            className="shrink-0 border-r border-border-default bg-bg-primary"
            style={{ width: LIST_WIDTH }}
          >
            {/* Corner header */}
            <div
              className="flex items-center border-b border-border-default px-3 text-xs font-semibold text-text-secondary"
              style={{ height: HEADER_HEIGHT }}
            >
              任务
            </div>
            {/* Task rows */}
            <div className="overflow-hidden">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center border-b border-border-default px-3 hover:bg-bg-secondary"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-xs font-medium text-text-primary', task.status === 'completed' && 'line-through text-text-secondary')}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      {format(task.start, 'MM/dd')} - {format(task.end, 'MM/dd')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <div className="relative" style={{ width: timelineWidth }}>
              {/* Date header */}
              <div
                className="sticky top-0 z-10 flex border-b border-border-default bg-bg-primary"
                style={{ height: HEADER_HEIGHT }}
              >
                {dates.map((date) => (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'flex shrink-0 flex-col items-center justify-center border-r border-border-default/50 text-[10px]',
                      isWeekend(date) && 'bg-bg-secondary/50',
                      isToday(date) && 'bg-primary-light/30'
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className={cn('font-medium', isToday(date) ? 'text-primary' : 'text-text-secondary')}>
                      {format(date, 'E', { locale: zhCN })}
                    </span>
                    <span className={cn(isToday(date) ? 'font-semibold text-text-primary' : 'text-text-tertiary')}>
                      {format(date, 'MM/dd')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid + tasks */}
              <div className="relative">
                {/* Grid columns */}
                <div className="absolute inset-0 flex">
                  {dates.map((date) => (
                    <div
                      key={`grid-${date.toISOString()}`}
                      className={cn(
                        'shrink-0 border-r border-border-default/30',
                        isWeekend(date) && 'bg-bg-secondary/30'
                      )}
                      style={{ width: DAY_WIDTH, height: sortedTasks.length * ROW_HEIGHT }}
                    />
                  ))}
                </div>

                {/* Today indicator */}
                {todayLineLeft !== null && (
                  <div
                    className="absolute top-0 bottom-0 z-20 w-px bg-danger"
                    style={{ left: todayLineLeft }}
                  >
                    <div className="absolute -top-1 -translate-x-1/2 rounded bg-danger px-1 py-0.5 text-[9px] font-medium text-white">
                      今天
                    </div>
                  </div>
                )}

                {/* Task bars */}
                {sortedTasks.map((task) => {
                  const { left, width } = getTaskStyle(task);
                  const completed = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className="relative border-b border-border-default/50"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <button
                        type="button"
                        onClick={() => openEditDialog(task)}
                        className={cn(
                          'absolute top-1.5 flex h-7 items-center gap-1 rounded-md border px-2 text-left text-[11px] font-medium transition-all hover:brightness-95 hover:shadow-sm',
                          completed
                            ? 'border-success bg-success/30 text-success'
                            : 'border-primary bg-primary/20 text-primary'
                        )}
                        style={{ left: left + 2, width }}
                        title={`${task.title} (${format(task.start, 'yyyy-MM-dd')} ~ ${format(task.end, 'yyyy-MM-dd')})`}
                      >
                        <span className="truncate">{task.title}</span>
                        {width > 80 && (
                          <span className="ml-auto shrink-0 text-[9px] opacity-80">
                            {differenceInDays(task.end, task.start) + 1}天
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

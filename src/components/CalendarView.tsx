import { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Button } from './ui/Button';
import { cn } from '../utils';
import type { TaskWithTags } from '../types';

type CalendarSubView = 'month' | 'week' | 'day';

function getTaskDateRange(task: TaskWithTags): { start: Date | null; end: Date | null } {
  return {
    start: task.start_date ? parseISO(task.start_date) : null,
    end: task.due_date ? parseISO(task.due_date) : null,
  };
}

function isTaskOnDate(task: TaskWithTags, date: Date): boolean {
  const { start, end } = getTaskDateRange(task);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // 无时间任务：不显示在日历上（或可选择显示）
  if (!start && !end) return false;

  // 只有开始时间：开始当天显示
  if (start && !end) return isSameDay(start, date);

  // 只有结束时间：结束当天显示
  if (!start && end) return isSameDay(end, date);

  // 有开始和结束：时间段与当天有交集
  return (
    isWithinInterval(dayStart, { start: startOfDay(start!), end: endOfDay(end!) }) ||
    isWithinInterval(dayEnd, { start: startOfDay(start!), end: endOfDay(end!) }) ||
    isWithinInterval(start!, { start: dayStart, end: dayEnd }) ||
    isWithinInterval(end!, { start: dayStart, end: dayEnd })
  );
}

export function CalendarView() {
  const { tasks, loading, openEditDialog, openCreateDialog } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [subView, setSubView] = useState<CalendarSubView>('month');

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && !t.deleted_at),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'completed' && !t.deleted_at),
    [tasks]
  );

  // Month view
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const navigateToday = () => setCurrentDate(new Date());
  const navigatePrev = () => {
    if (subView === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (subView === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const navigateNext = () => {
    if (subView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (subView === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const renderHeaderTitle = () => {
    if (subView === 'month') return format(currentDate, 'yyyy年M月', { locale: zhCN });
    if (subView === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${format(start, 'M月d日', { locale: zhCN })} - ${format(end, 'M月d日', { locale: zhCN })}`;
    }
    return format(currentDate, 'yyyy年M月d日 EEEE', { locale: zhCN });
  };

  const handleDateClick = (date: Date) => {
    openCreateDialog(endOfDay(date).toISOString());
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-secondary">
      {/* Header */}
      <div className="flex min-h-14 flex-col gap-2 border-b border-border-default bg-bg-primary px-4 py-2 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-text-primary md:text-lg">日历</h1>
          <span className="text-sm font-medium text-text-primary md:text-base md:min-w-[180px]">{renderHeaderTitle()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border-default bg-bg-secondary p-0.5">
            {(['month', 'week', 'day'] as CalendarSubView[]).map((v) => (
              <button
                key={v}
                onClick={() => setSubView(v)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  subView === v ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-tertiary'
                )}
              >
                {v === 'month' ? '月' : v === 'week' ? '周' : '日'}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={navigateToday}>
            今天
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {subView === 'month' && (
          <MonthView
            days={monthDays}
            currentDate={currentDate}
            tasks={activeTasks}
            completedTasks={completedTasks}
            onDateClick={handleDateClick}
            onTaskClick={openEditDialog}
          />
        )}
        {subView === 'week' && (
          <WeekView
            days={weekDays}
            tasks={activeTasks}
            completedTasks={completedTasks}
            onDateClick={handleDateClick}
            onTaskClick={openEditDialog}
          />
        )}
        {subView === 'day' && (
          <DayView
            date={currentDate}
            tasks={activeTasks}
            completedTasks={completedTasks}
            onDateClick={handleDateClick}
            onTaskClick={openEditDialog}
          />
        )}
      </div>
    </div>
  );
}

// Month View
function MonthView({
  days,
  currentDate,
  tasks,
  completedTasks,
  onDateClick,
  onTaskClick,
}: {
  days: Date[];
  currentDate: Date;
  tasks: TaskWithTags[];
  completedTasks: TaskWithTags[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: TaskWithTags) => void;
}) {
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="h-full rounded-xl border border-border-default bg-bg-primary p-4">
      <div className="grid grid-cols-7 gap-px border-b border-border-default pb-2">
        {weekDays.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-text-secondary">
            周{d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => isTaskOnDate(t, day));
          const dayCompleted = completedTasks.filter((t) => isTaskOnDate(t, day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const hasOverdue = dayTasks.some((t) => t.due_date && parseISO(t.due_date) < startOfDay(new Date()));

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'min-h-[100px] border-b border-r border-border-default p-2 transition-colors hover:bg-bg-secondary cursor-pointer',
                !isCurrentMonth && 'bg-bg-secondary/50 text-text-tertiary',
                isTodayDate && 'bg-primary-light/30'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isTodayDate ? 'h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center' : 'text-text-primary'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {(dayTasks.length > 0 || dayCompleted.length > 0) && (
                  <span className="text-[10px] text-text-tertiary">
                    {dayTasks.length + dayCompleted.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className={cn(
                      'truncate rounded px-1.5 py-0.5 text-[10px] font-medium',
                      hasOverdue && 'bg-danger/10 text-danger',
                      !hasOverdue && 'bg-primary/10 text-primary'
                    )}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayCompleted.slice(0, Math.max(0, 3 - dayTasks.length)).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className="truncate rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary line-through"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length + dayCompleted.length > 3 && (
                  <div className="text-[10px] text-text-tertiary pl-1">
                    +{dayTasks.length + dayCompleted.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View
function WeekView({
  days,
  tasks,
  completedTasks,
  onDateClick,
  onTaskClick,
}: {
  days: Date[];
  tasks: TaskWithTags[];
  completedTasks: TaskWithTags[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: TaskWithTags) => void;
}) {
  return (
    <div className="h-full rounded-xl border border-border-default bg-bg-primary p-4">
      <div className="grid grid-cols-7 gap-px border-b border-border-default">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'py-3 text-center',
              isToday(day) && 'bg-primary-light/30 rounded-t-lg'
            )}
          >
            <div className="text-xs text-text-secondary">{format(day, 'E', { locale: zhCN })}</div>
            <div
              className={cn(
                'mx-auto mt-1 flex h-7 w-7 items-center justify-center text-sm font-medium',
                isToday(day) ? 'rounded-full bg-primary text-white' : 'text-text-primary'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px divide-x divide-border-default">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => isTaskOnDate(t, day));
          const dayCompleted = completedTasks.filter((t) => isTaskOnDate(t, day));

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className="min-h-[400px] cursor-pointer p-2 transition-colors hover:bg-bg-secondary"
            >
              <div className="space-y-1.5">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className={cn(
                      'rounded border-l-2 bg-bg-secondary px-2 py-1.5 text-xs',
                      task.due_date && parseISO(task.due_date) < startOfDay(new Date())
                        ? 'border-danger text-danger'
                        : 'border-primary text-text-primary'
                    )}
                    title={task.title}
                  >
                    <div className="truncate font-medium">{task.title}</div>
                    <div className="mt-0.5 text-[10px] text-text-tertiary">
                      {task.start_date && task.due_date && !isSameDay(parseISO(task.start_date), parseISO(task.due_date)) ? (
                        <span>
                          {format(parseISO(task.start_date), 'MM/dd HH:mm')} - {format(parseISO(task.due_date), 'MM/dd HH:mm')}
                        </span>
                      ) : (
                        <span>
                          {task.start_date && format(parseISO(task.start_date), 'HH:mm')}
                          {task.start_date && task.due_date && ' - '}
                          {task.due_date && format(parseISO(task.due_date), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {dayCompleted.map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className="rounded border-l-2 border-success bg-bg-tertiary px-2 py-1.5 text-xs text-text-tertiary line-through"
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View
function DayView({
  date,
  tasks,
  completedTasks,
  onDateClick,
  onTaskClick,
}: {
  date: Date;
  tasks: TaskWithTags[];
  completedTasks: TaskWithTags[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: TaskWithTags) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayTasks = tasks.filter((t) => isTaskOnDate(t, date));
  const dayCompleted = completedTasks.filter((t) => isTaskOnDate(t, date));
  const allDayTasks = dayTasks.filter(
    (t) => !t.start_date || !t.due_date || !isSameDay(parseISO(t.start_date), parseISO(t.due_date))
  );
  const timedTasks = dayTasks.filter(
    (t) => t.start_date && t.due_date && isSameDay(parseISO(t.start_date), parseISO(t.due_date))
  );

  // Layout timed tasks so overlapping ones are shown side-by-side
  const timedLayouts = useMemo(() => {
    const layouts = timedTasks
      .map((task) => {
        const start = parseISO(task.start_date!);
        const end = parseISO(task.due_date!);
        const dayStart = startOfDay(date);

        let displayStart = start;
        let displayEnd = end;
        if (!isSameDay(start, end)) {
          if (isSameDay(start, date)) {
            displayEnd = endOfDay(date);
          } else if (isSameDay(end, date)) {
            displayStart = dayStart;
          } else {
            displayStart = dayStart;
            displayEnd = endOfDay(date);
          }
        }

        const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
        const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;
        return {
          task,
          start,
          end,
          displayStart,
          displayEnd,
          startHour,
          endHour,
          top: startHour * 48,
          height: Math.max(24, (endHour - startHour) * 48),
          column: 0,
          totalColumns: 1,
        };
      })
      .sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);

    // Group overlapping tasks and assign columns within each group
    let currentGroup: typeof layouts = [];
    let groupEnd = -1;
    const groups: (typeof layouts)[] = [];

    for (const layout of layouts) {
      if (currentGroup.length === 0 || layout.startHour < groupEnd) {
        currentGroup.push(layout);
        groupEnd = Math.max(groupEnd, layout.endHour);
      } else {
        groups.push(currentGroup);
        currentGroup = [layout];
        groupEnd = layout.endHour;
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);

    for (const group of groups) {
      const total = group.length;
      group.forEach((layout, index) => {
        layout.column = index;
        layout.totalColumns = total;
      });
    }

    return layouts;
  }, [timedTasks, date]);

  return (
    <div className="h-full rounded-xl border border-border-default bg-bg-primary p-4">
      {/* All day section */}
      <div className="mb-4 rounded-lg border border-border-default bg-bg-secondary p-3">
        <div className="mb-2 text-xs font-semibold text-text-secondary">全天</div>
        <div className="space-y-1.5">
          {[...allDayTasks, ...dayCompleted].map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={cn(
                'cursor-pointer rounded px-2 py-1 text-xs',
                task.status === 'completed'
                  ? 'bg-bg-tertiary text-text-tertiary line-through'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {task.title}
            </div>
          ))}
          {allDayTasks.length === 0 && dayCompleted.length === 0 && (
            <div className="text-xs text-text-tertiary">无全天任务</div>
          )}
        </div>
      </div>

      {/* Time grid */}
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex min-h-[48px] border-b border-border-default/50">
            <div className="w-14 shrink-0 py-1 text-xs text-text-tertiary">{String(hour).padStart(2, '0')}:00</div>
            <div
              className="flex-1 cursor-pointer py-1 transition-colors hover:bg-bg-secondary"
              onClick={() => {
                const clickedDate = new Date(date);
                clickedDate.setHours(hour, 0, 0, 0);
                onDateClick(clickedDate);
              }}
            />
          </div>
        ))}

        {/* Timed tasks */}
        {timedLayouts.map((layout) => {
          const { task, start, end, displayStart, displayEnd, top, height, column, totalColumns } = layout;

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={cn(
                'absolute cursor-pointer rounded border-l-2 bg-primary/10 px-2 py-1 text-xs hover:bg-primary/20',
                task.due_date && parseISO(task.due_date) < new Date() ? 'border-danger text-danger' : 'border-primary text-text-primary'
              )}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                left: `calc(3.5rem + (100% - 3.5rem - 0.5rem) * ${column} / ${totalColumns})`,
                width: `calc((100% - 3.5rem - 0.5rem) / ${totalColumns} - 4px)`,
              }}
            >
              <div className="truncate font-medium">{task.title}</div>
              <div className="text-[10px] text-text-secondary">
                {format(displayStart, 'HH:mm')} - {format(displayEnd, 'HH:mm')}
                {!isSameDay(start, end) && (
                  <span className="ml-1 opacity-70">({format(start, 'MM/dd')} - {format(end, 'MM/dd')})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

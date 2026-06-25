import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type { Task, List, Tag, TaskTag, SubTask, Reminder, Settings, Priority, Quadrant, TaskWithTags, SmartListFilter } from '../types';

const now = () => new Date().toISOString();

export const getQuadrant = (urgency: number, importance: number): Quadrant => {
  const urgent = urgency >= 5.5;
  const important = importance >= 5.5;
  if (urgent && important) return 'Q1';
  if (!urgent && important) return 'Q2';
  if (urgent && !important) return 'Q3';
  return 'Q4';
};

export const priorityToScores = (priority: Priority): { urgency: number; importance: number } => {
  switch (priority) {
    case 'high':
      return { urgency: 8, importance: 8 };
    case 'medium':
      return { urgency: 5, importance: 5 };
    case 'low':
      return { urgency: 2, importance: 2 };
    default:
      return { urgency: 5, importance: 5 };
  }
};

export const SYSTEM_LISTS: Omit<List, 'created_at' | 'updated_at'>[] = [
  { id: 'all', name: '所有任务', color: '#3B82F6', icon: 'LayoutGrid', type: 'system', sort_order: 0, filter_data: null },
  { id: 'today', name: '今天', color: '#10B981', icon: 'CalendarCheck', type: 'system', sort_order: 1, filter_data: null },
  { id: 'planned', name: '计划', color: '#8B5CF6', icon: 'CalendarDays', type: 'system', sort_order: 2, filter_data: null },
  { id: 'completed', name: '已完成', color: '#6B7280', icon: 'CheckCircle2', type: 'system', sort_order: 3, filter_data: null },
  { id: 'trash', name: '回收站', color: '#EF4444', icon: 'Trash2', type: 'system', sort_order: 4, filter_data: null },
];

export const seedSystemLists = async () => {
  const existing = await db.lists.count();
  if (existing > 0) return;
  const ts = now();
  await db.lists.bulkAdd(
    SYSTEM_LISTS.map((list) => ({ ...list, filter_data: null, created_at: ts, updated_at: ts }))
  );
};

// Tasks

export interface CreateTaskInput {
  title: string;
  description?: string;
  start_date?: string | null;
  due_date?: string | null;
  priority?: Priority;
  urgency?: number;
  importance?: number;
  list_id?: string | null;
  tags?: string[];
}

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const scores = priorityToScores(input.priority || 'none');
  const ts = now();
  const task: Task = {
    id: uuidv4(),
    title: input.title.slice(0, 500),
    description: input.description || '',
    start_date: input.start_date || null,
    due_date: input.due_date || null,
    priority: input.priority || 'none',
    urgency: input.urgency ?? scores.urgency,
    importance: input.importance ?? scores.importance,
    status: 'active',
    list_id: input.list_id || null,
    sort_order: Date.now(),
    is_repeat: 0,
    repeat_rule: null,
    created_at: ts,
    updated_at: ts,
    completed_at: null,
    deleted_at: null,
    color: null,
    parent_id: null,
  };
  await db.tasks.add(task);
  if (input.tags?.length) {
    await db.taskTags.bulkAdd(input.tags.map((tagId) => ({ task_id: task.id, tag_id: tagId })));
  }
  return task;
};

export const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> => {
  const existing = await db.tasks.get(id);
  if (!existing) throw new Error(`Task ${id} not found`);
  const updated: Task = { ...existing, ...updates, updated_at: now() };
  await db.tasks.put(updated);
  return updated;
};

export const toggleTaskComplete = async (id: string): Promise<Task> => {
  const task = await db.tasks.get(id);
  if (!task) throw new Error(`Task ${id} not found`);
  const completed = task.status === 'completed';
  const updates: Partial<Task> = {
    status: completed ? 'active' : 'completed',
    completed_at: completed ? null : now(),
  };
  return updateTask(id, updates);
};

export const softDeleteTask = async (id: string): Promise<Task> => {
  return updateTask(id, { deleted_at: now(), status: 'active' });
};

export const restoreTask = async (id: string): Promise<Task> => {
  return updateTask(id, { deleted_at: null });
};

export const permanentDeleteTask = async (id: string): Promise<void> => {
  await db.taskTags.where('task_id').equals(id).delete();
  await db.subTasks.where('task_id').equals(id).delete();
  await db.reminders.where('task_id').equals(id).delete();
  await db.tasks.delete(id);
};

export const emptyTrash = async (): Promise<void> => {
  const tasks = await db.tasks.where('deleted_at').notEqual('').filter((t) => t.deleted_at !== null).toArray();
  await Promise.all(tasks.map((t) => permanentDeleteTask(t.id)));
};

// SubTasks

export const MAX_SUBTASKS = 100;

export const getSubTasksByTask = async (taskId: string): Promise<SubTask[]> => {
  return db.subTasks.where('task_id').equals(taskId).sortBy('sort_order');
};

export const createSubTask = async (taskId: string, title: string): Promise<SubTask> => {
  const existing = await db.subTasks.where('task_id').equals(taskId).count();
  if (existing >= MAX_SUBTASKS) {
    throw new Error(`每个任务最多 ${MAX_SUBTASKS} 个子任务`);
  }
  const ts = now();
  const subTask: SubTask = {
    id: uuidv4(),
    task_id: taskId,
    title: title.slice(0, 500),
    is_completed: 0,
    sort_order: Date.now(),
    created_at: ts,
    completed_at: null,
  };
  await db.subTasks.add(subTask);
  return subTask;
};

export const updateSubTask = async (id: string, updates: Partial<Omit<SubTask, 'id' | 'created_at'>>): Promise<SubTask> => {
  const existing = await db.subTasks.get(id);
  if (!existing) throw new Error(`SubTask ${id} not found`);
  const updated: SubTask = { ...existing, ...updates };
  await db.subTasks.put(updated);
  return updated;
};

export const toggleSubTaskComplete = async (id: string): Promise<SubTask> => {
  const subTask = await db.subTasks.get(id);
  if (!subTask) throw new Error(`SubTask ${id} not found`);
  const completed = subTask.is_completed === 1;
  return updateSubTask(id, {
    is_completed: completed ? 0 : 1,
    completed_at: completed ? null : now(),
  });
};

export const deleteSubTask = async (id: string): Promise<void> => {
  await db.subTasks.delete(id);
};

// Lists

export const getLists = async (): Promise<List[]> => {
  return db.lists.orderBy('sort_order').toArray();
};

export const createList = async (name: string, color = '#3B82F6', icon = 'List'): Promise<List> => {
  const ts = now();
  const list: List = {
    id: uuidv4(),
    name,
    color,
    icon,
    type: 'custom',
    sort_order: Date.now(),
    filter_data: null,
    created_at: ts,
    updated_at: ts,
  };
  await db.lists.add(list);
  return list;
};

export const createSmartList = async (name: string, filter: SmartListFilter, color = '#3B82F6', icon = 'List'): Promise<List> => {
  const ts = now();
  const list: List = {
    id: uuidv4(),
    name,
    color,
    icon,
    type: 'smart',
    sort_order: Date.now(),
    filter_data: filter,
    created_at: ts,
    updated_at: ts,
  };
  await db.lists.add(list);
  return list;
};

export const updateList = async (id: string, updates: Partial<List>): Promise<List> => {
  const existing = await db.lists.get(id);
  if (!existing) throw new Error(`List ${id} not found`);
  const updated = { ...existing, ...updates, updated_at: now() };
  await db.lists.put(updated);
  return updated;
};

export const deleteList = async (id: string, moveToAll = true): Promise<void> => {
  if (moveToAll) {
    await db.tasks.where('list_id').equals(id).modify({ list_id: null });
  }
  await db.lists.delete(id);
};

// Tags

export const getTags = async (): Promise<Tag[]> => {
  return db.tags.orderBy('name').toArray();
};

export const createTag = async (name: string, color = '#6366F1'): Promise<Tag> => {
  const ts = now();
  const tag: Tag = { id: uuidv4(), name, color, created_at: ts };
  await db.tags.add(tag);
  return tag;
};

export const updateTag = async (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>): Promise<Tag> => {
  const existing = await db.tags.get(id);
  if (!existing) throw new Error(`Tag ${id} not found`);
  const updated: Tag = { ...existing, ...updates };
  await db.tags.put(updated);
  return updated;
};

export const deleteTag = async (id: string): Promise<void> => {
  await db.taskTags.where('tag_id').equals(id).delete();
  await db.tags.delete(id);
};

export const setTaskTags = async (taskId: string, tagIds: string[]): Promise<void> => {
  await db.transaction('rw', db.taskTags, async () => {
    await db.taskTags.where('task_id').equals(taskId).delete();
    if (tagIds.length > 0) {
      await db.taskTags.bulkAdd(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })));
    }
  });
};

// Task with tags

export const getTaskWithTags = async (id: string): Promise<TaskWithTags | undefined> => {
  const task = await db.tasks.get(id);
  if (!task) return undefined;
  const [taskTags, subTasks] = await Promise.all([
    db.taskTags.where('task_id').equals(id).toArray(),
    db.subTasks.where('task_id').equals(id).sortBy('sort_order'),
  ]);
  const tags = await db.tags.bulkGet(taskTags.map((tt) => tt.tag_id));
  return { ...task, tags: tags.filter(Boolean) as Tag[], sub_tasks: subTasks };
};

// Settings

export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  const setting = await db.settings.get(key);
  if (!setting) return defaultValue;
  try {
    return JSON.parse(setting.value) as T;
  } catch {
    return defaultValue;
  }
};

export const setSetting = async <T>(key: string, value: T): Promise<void> => {
  await db.settings.put({ key, value: JSON.stringify(value), updated_at: now() });
};

// Import / Export

export interface BackupData {
  tasks: Task[];
  lists: List[];
  tags: Tag[];
  taskTags: TaskTag[];
  subTasks: SubTask[];
  reminders: Reminder[];
  settings: Settings[];
  exported_at: string;
  version: number;
}

export const exportData = async (): Promise<BackupData> => {
  return {
    tasks: await db.tasks.toArray(),
    lists: await db.lists.toArray(),
    tags: await db.tags.toArray(),
    taskTags: await db.taskTags.toArray(),
    subTasks: await db.subTasks.toArray(),
    reminders: await db.reminders.toArray(),
    settings: await db.settings.toArray(),
    exported_at: now(),
    version: 1,
  };
};

export const importData = async (data: BackupData): Promise<void> => {
  await db.transaction('rw', [db.tasks, db.lists, db.tags, db.taskTags, db.subTasks, db.reminders, db.settings], async () => {
    // Merge mode: upsert by id
    if (data.tasks?.length) await db.tasks.bulkPut(data.tasks);
    if (data.lists?.length) await db.lists.bulkPut(data.lists);
    if (data.tags?.length) await db.tags.bulkPut(data.tags);
    if (data.taskTags?.length) await db.taskTags.bulkPut(data.taskTags);
    if (data.subTasks?.length) await db.subTasks.bulkPut(data.subTasks);
    if (data.reminders?.length) await db.reminders.bulkPut(data.reminders);
    if (data.settings?.length) await db.settings.bulkPut(data.settings);
  });
};

// Filter helpers

export interface TaskFilter {
  listId?: string;
  status?: 'active' | 'completed' | 'all';
  deleted?: boolean;
  quadrant?: Quadrant;
  search?: string;
  tags?: string[];
  priorities?: Priority[];
  dueDateFrom?: string | null;
  dueDateTo?: string | null;
}

export const filterTasks = async (filter: TaskFilter): Promise<TaskWithTags[]> => {
  let collection = db.tasks.toCollection();

  if (filter.deleted) {
    collection = collection.filter((t) => t.deleted_at !== null);
  } else {
    collection = collection.filter((t) => t.deleted_at === null);
  }

  if (filter.status && filter.status !== 'all') {
    collection = collection.filter((t) => t.status === filter.status);
  }

  if (filter.listId) {
    if (filter.listId === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayStr = today.toISOString();
      const tomorrowStr = tomorrow.toISOString();
      collection = collection.filter((t) => {
        // 无时间任务默认显示在今天
        if (!t.start_date && !t.due_date) return true;
        // 时间段包含今天：start < tomorrow 且 due >= todayStart
        const startBeforeTomorrow = !t.start_date || t.start_date < tomorrowStr;
        const endAfterTodayStart = !t.due_date || t.due_date >= todayStr;
        return startBeforeTomorrow && endAfterTodayStart;
      });
    } else if (filter.listId === 'planned') {
      collection = collection.filter((t) => t.start_date !== null || t.due_date !== null);
    } else if (filter.listId === 'completed') {
      collection = collection.filter((t) => t.status === 'completed');
    } else if (filter.listId === 'trash') {
      // 回收站只按 deleted 过滤，不限制 list_id
    } else if (filter.listId !== 'all') {
      collection = collection.filter((t) => t.list_id === filter.listId);
    }
  }

  if (filter.quadrant) {
    collection = collection.filter((t) => getQuadrant(t.urgency, t.importance) === filter.quadrant);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    collection = collection.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  if (filter.priorities && filter.priorities.length > 0) {
    collection = collection.filter((t) => filter.priorities!.includes(t.priority));
  }

  if (filter.dueDateFrom || filter.dueDateTo) {
    collection = collection.filter((t) => {
      if (!t.due_date) return false;
      if (filter.dueDateFrom && t.due_date < filter.dueDateFrom) return false;
      if (filter.dueDateTo && t.due_date > filter.dueDateTo) return false;
      return true;
    });
  }

  let tasks = await collection.sortBy('sort_order');
  const taskIds = tasks.map((t) => t.id);
  const [taskTags, subTasks] = await Promise.all([
    db.taskTags.where('task_id').anyOf(taskIds).toArray(),
    db.subTasks.where('task_id').anyOf(taskIds).sortBy('sort_order'),
  ]);

  if (filter.tags && filter.tags.length > 0) {
    const taskTagIdsByTask = new Map<string, Set<string>>();
    taskTags.forEach((tt) => {
      if (!taskTagIdsByTask.has(tt.task_id)) taskTagIdsByTask.set(tt.task_id, new Set());
      taskTagIdsByTask.get(tt.task_id)!.add(tt.tag_id);
    });
    tasks = tasks.filter((t) => filter.tags!.every((tagId) => taskTagIdsByTask.get(t.id)?.has(tagId)));
  }

  const tagIds = [...new Set(taskTags.map((tt) => tt.tag_id))];
  const tags = await db.tags.bulkGet(tagIds);
  const tagMap = new Map<string, Tag>();
  tags.filter(Boolean).forEach((t) => tagMap.set(t!.id, t as Tag));

  const tagsByTask = new Map<string, Tag[]>();
  taskTags.forEach((tt) => {
    const tag = tagMap.get(tt.tag_id);
    if (tag) {
      if (!tagsByTask.has(tt.task_id)) tagsByTask.set(tt.task_id, []);
      tagsByTask.get(tt.task_id)!.push(tag);
    }
  });

  const subTasksByTask = new Map<string, SubTask[]>();
  subTasks.forEach((st) => {
    if (!subTasksByTask.has(st.task_id)) subTasksByTask.set(st.task_id, []);
    subTasksByTask.get(st.task_id)!.push(st);
  });

  return tasks.map((t) => ({
    ...t,
    tags: tagsByTask.get(t.id) || [],
    sub_tasks: subTasksByTask.get(t.id) || [],
  }));
};

export const reorderTasks = async (orderedIds: string[]): Promise<void> => {
  await db.transaction('rw', db.tasks, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.tasks.update(orderedIds[i], { sort_order: i });
    }
  });
};

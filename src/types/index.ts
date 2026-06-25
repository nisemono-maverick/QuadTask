export type Priority = 'high' | 'medium' | 'low' | 'none';

export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Task {
  id: string;
  title: string;
  description: string;
  start_date: string | null; // ISO 8601，时间段开始
  due_date: string | null; // ISO 8601，时间段结束
  priority: Priority;
  urgency: number; // 1-10
  importance: number; // 1-10
  status: 'active' | 'completed' | 'archived';
  list_id: string | null;
  sort_order: number;
  is_repeat: number; // 0/1
  repeat_rule: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  deleted_at: string | null;
  color: string | null;
  parent_id: string | null;
}

export interface SmartListFilter {
  tags?: string[];
  priorities?: Priority[];
  status?: 'all' | 'active' | 'completed';
  dueDateFrom?: string | null;
  dueDateTo?: string | null;
  quadrant?: Quadrant;
  search?: string;
}

export interface List {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'system' | 'custom' | 'smart';
  sort_order: number;
  filter_data: SmartListFilter | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskTag {
  task_id: string;
  tag_id: string;
}

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  is_completed: number; // 0/1
  sort_order: number;
  created_at: string;
  completed_at: string | null;
}

export interface Reminder {
  id: string;
  task_id: string;
  remind_at: string;
  offset_minutes: number | null;
  is_triggered: number; // 0/1
  created_at: string;
}

export interface Settings {
  key: string;
  value: string;
  updated_at: string;
}

export interface TaskWithTags extends Task {
  tags?: Tag[];
  sub_tasks?: SubTask[];
}

export type ViewMode = 'list' | 'quadrants' | 'calendar' | 'settings';

export interface FilterState {
  query: string;
  lists: string[];
  tags: string[];
  priorities: Priority[];
  status: 'all' | 'active' | 'completed';
  quadrants: Quadrant[];
  dueDateFrom: string | null;
  dueDateTo: string | null;
}

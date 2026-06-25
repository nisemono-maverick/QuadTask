import Dexie, { type Table } from 'dexie';
import type { Task, List, Tag, TaskTag, SubTask, Reminder, Settings } from '../types';

export const DB_NAME = 'QuadTaskDB';
export const DB_VERSION = 3;

export class QuadTaskDB extends Dexie {
  tasks!: Table<Task, string>;
  lists!: Table<List, string>;
  tags!: Table<Tag, string>;
  taskTags!: Table<TaskTag, [string, string]>;
  subTasks!: Table<SubTask, string>;
  reminders!: Table<Reminder, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      tasks: 'id, list_id, status, start_date, due_date, priority, deleted_at, [urgency+importance]',
      lists: 'id, type, sort_order',
      tags: 'id, name',
      taskTags: '[task_id+tag_id], task_id, tag_id',
      subTasks: 'id, task_id, sort_order',
      reminders: 'id, task_id, remind_at',
      settings: 'key',
    }).upgrade((tx) => {
      // v2 -> v3: 为现有清单添加 filter_data 字段
      return tx.table('lists').toCollection().modify((list: List) => {
        if (list.filter_data === undefined) {
          list.filter_data = null;
        }
      });
    });
  }
}

export const db = new QuadTaskDB();

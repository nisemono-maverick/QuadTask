import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  Task,
  List,
  Tag,
  SubTask,
  TaskWithTags,
  ViewMode,
  Priority,
  Quadrant,
  SmartListFilter,
  ThemeMode,
} from '../types';
import { AppContext } from './context';
import {
  seedSystemLists,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  toggleTaskComplete,
  softDeleteTask,
  restoreTask,
  permanentDeleteTask,
  emptyTrash,
  getLists,
  createList as dbCreateList,
  createSmartList,
  updateList as dbUpdateList,
  deleteList as dbDeleteList,
  getTags,
  createTag as dbCreateTag,
  updateTag as dbUpdateTag,
  deleteTag as dbDeleteTag,
  setTaskTags,
  createSubTask as dbCreateSubTask,
  updateSubTask as dbUpdateSubTask,
  toggleSubTaskComplete,
  deleteSubTask as dbDeleteSubTask,
  filterTasks,
  reorderTasks,
  exportData as dbExportData,
  importData as dbImportData,
  getSetting,
  setSetting,
  seedDemoTasks,
  type CreateTaskInput,
} from '../db/operations';

interface AppState {
  lists: List[];
  tags: Tag[];
  tasks: TaskWithTags[];
  selectedListId: string;
  viewMode: ViewMode;
  loading: boolean;
  dialogOpen: boolean;
  editingTask: TaskWithTags | null;
  createDialogInitialDate: string | null;
  searchQuery: string;
  theme: ThemeMode;
  filterTags: string[];
  filterPriorities: Priority[];
  filterStatus: 'all' | 'active' | 'completed';
  filterDueDateFrom: string | null;
  filterDueDateTo: string | null;
  filterQuadrant: Quadrant | null;
}

export interface AppContextValue extends AppState {
  refreshLists: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  selectList: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (q: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setFilterTags: (tags: string[]) => void;
  setFilterPriorities: (priorities: Priority[]) => void;
  setFilterStatus: (status: 'all' | 'active' | 'completed') => void;
  setFilterDueDateFrom: (date: string | null) => void;
  setFilterDueDateTo: (date: string | null) => void;
  setFilterQuadrant: (quadrant: Quadrant | null) => void;
  clearFilters: () => void;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => Promise<void>;
  moveTaskToList: (taskId: string, listId: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  createList: (name: string, color?: string, icon?: string) => Promise<void>;
  createSmartList: (name: string, filter: SmartListFilter, color?: string, icon?: string) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  createTag: (name: string, color?: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  setTaskTags: (taskId: string, tagIds: string[]) => Promise<void>;
  createSubTask: (taskId: string, title: string) => Promise<void>;
  updateSubTask: (id: string, updates: Partial<Omit<SubTask, 'id' | 'created_at'>>) => Promise<void>;
  toggleSubTask: (id: string) => Promise<void>;
  deleteSubTask: (id: string) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  openEditDialog: (task: TaskWithTags) => void;
  openCreateDialog: (initialDate?: string | null) => void;
  closeDialog: () => void;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<List[]>([]);
  const listsRef = useRef(lists);
  listsRef.current = lists;
  const [tags, setTags] = useState<Tag[]>([]);
  const [tasks, setTasks] = useState<TaskWithTags[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('quadrants');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithTags | null>(null);
  const [createDialogInitialDate, setCreateDialogInitialDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterDueDateFrom, setFilterDueDateFrom] = useState<string | null>(null);
  const [filterDueDateTo, setFilterDueDateTo] = useState<string | null>(null);
  const [filterQuadrant, setFilterQuadrant] = useState<Quadrant | null>(null);

  const refreshLists = useCallback(async () => {
    await seedSystemLists();
    const data = await getLists();
    setLists(data);
  }, []);

  const refreshTags = useCallback(async () => {
    const data = await getTags();
    setTags(data);
  }, []);

  const refreshTasks = useCallback(async () => {
    const isTrash = selectedListId === 'trash';
    const isCompleted = selectedListId === 'completed';
    const status = isCompleted ? 'completed' : filterStatus;
    const selectedList = listsRef.current.find((l) => l.id === selectedListId);
    const isSmartList = selectedList?.type === 'smart';

    const filter: Parameters<typeof filterTasks>[0] = {
      listId: isSmartList ? undefined : selectedListId,
      deleted: isTrash,
      status,
      search: searchQuery || undefined,
      tags: filterTags.length > 0 ? filterTags : undefined,
      priorities: filterPriorities.length > 0 ? filterPriorities : undefined,
      dueDateFrom: filterDueDateFrom || undefined,
      dueDateTo: filterDueDateTo || undefined,
      quadrant: filterQuadrant || undefined,
    };
    const data = await filterTasks(filter);
    setTasks(data);
  }, [selectedListId, searchQuery, filterTags, filterPriorities, filterStatus, filterDueDateFrom, filterDueDateTo, filterQuadrant]);

  const setViewModeAndReset = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'quadrants') {
      setSelectedListId('all');
    }
  }, []);

  const applyThemeClass = useCallback((nextTheme: ThemeMode) => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    if (nextTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      html.classList.add(nextTheme);
    }
  }, []);

  const setTheme = useCallback(async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyThemeClass(nextTheme);
    await setSetting('theme', nextTheme);
  }, [applyThemeClass]);

  const clearFilters = useCallback(() => {
    setFilterTags([]);
    setFilterPriorities([]);
    setFilterStatus('all');
    setFilterDueDateFrom(null);
    setFilterDueDateTo(null);
    setFilterQuadrant(null);
  }, []);

  const applyFilterState = useCallback((filter: SmartListFilter | null) => {
    if (!filter) {
      clearFilters();
      return;
    }
    setFilterTags(filter.tags || []);
    setFilterPriorities(filter.priorities || []);
    setFilterStatus(filter.status || 'all');
    setFilterDueDateFrom(filter.dueDateFrom ?? null);
    setFilterDueDateTo(filter.dueDateTo ?? null);
    setFilterQuadrant(filter.quadrant ?? null);
    setSearchQuery(filter.search || '');
  }, [clearFilters]);

  const selectList = useCallback((id: string) => {
    setSelectedListId(id);
    setViewMode('list');
    const target = lists.find((l) => l.id === id);
    if (target?.type === 'smart') {
      applyFilterState(target.filter_data);
    }
  }, [lists, applyFilterState]);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    await dbCreateTask(input);
    await refreshTasks();
  }, [refreshTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    await dbUpdateTask(id, updates);
    await refreshTasks();
  }, [refreshTasks]);

  const moveTaskToList = useCallback(async (taskId: string, listId: string) => {
    await dbUpdateTask(taskId, { list_id: listId });
    await refreshTasks();
  }, [refreshTasks]);

  const toggleCompleteAction = useCallback(async (id: string) => {
    await toggleTaskComplete(id);
    await refreshTasks();
  }, [refreshTasks]);

  const deleteTaskAction = useCallback(async (id: string) => {
    await softDeleteTask(id);
    await refreshTasks();
  }, [refreshTasks]);

  const restoreTaskAction = useCallback(async (id: string) => {
    await restoreTask(id);
    await refreshTasks();
  }, [refreshTasks]);

  const permanentDeleteAction = useCallback(async (id: string) => {
    await permanentDeleteTask(id);
    await refreshTasks();
  }, [refreshTasks]);

  const emptyTrashAction = useCallback(async () => {
    await emptyTrash();
    await refreshTasks();
  }, [refreshTasks]);

  const createList = useCallback(async (name: string, color?: string, icon?: string) => {
    await dbCreateList(name, color, icon);
    await refreshLists();
  }, [refreshLists]);

  const createSmartListAction = useCallback(async (name: string, filter: SmartListFilter, color?: string, icon?: string) => {
    await createSmartList(name, filter, color, icon);
    await refreshLists();
  }, [refreshLists]);

  const updateList = useCallback(async (id: string, updates: Partial<List>) => {
    await dbUpdateList(id, updates);
    await refreshLists();
  }, [refreshLists]);

  const deleteList = useCallback(async (id: string) => {
    await dbDeleteList(id);
    await refreshLists();
    await refreshTasks();
  }, [refreshLists, refreshTasks]);

  const createTag = useCallback(async (name: string, color?: string) => {
    await dbCreateTag(name, color);
    await refreshTags();
  }, [refreshTags]);

  const updateTag = useCallback(async (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => {
    await dbUpdateTag(id, updates);
    await refreshTags();
    await refreshTasks();
  }, [refreshTags, refreshTasks]);

  const deleteTag = useCallback(async (id: string) => {
    await dbDeleteTag(id);
    await refreshTags();
    await refreshTasks();
  }, [refreshTags, refreshTasks]);

  const setTaskTagsAction = useCallback(async (taskId: string, tagIds: string[]) => {
    await setTaskTags(taskId, tagIds);
    await refreshTasks();
  }, [refreshTasks]);

  const createSubTask = useCallback(async (taskId: string, title: string) => {
    await dbCreateSubTask(taskId, title);
    await refreshTasks();
  }, [refreshTasks]);

  const updateSubTask = useCallback(async (id: string, updates: Partial<Omit<SubTask, 'id' | 'created_at'>>) => {
    await dbUpdateSubTask(id, updates);
    await refreshTasks();
  }, [refreshTasks]);

  const toggleSubTask = useCallback(async (id: string) => {
    await toggleSubTaskComplete(id);
    await refreshTasks();
  }, [refreshTasks]);

  const deleteSubTask = useCallback(async (id: string) => {
    await dbDeleteSubTask(id);
    await refreshTasks();
  }, [refreshTasks]);

  const reorderTasksAction = useCallback(async (orderedIds: string[]) => {
    await reorderTasks(orderedIds);
    await refreshTasks();
  }, [refreshTasks]);

  const openEditDialog = useCallback((task: TaskWithTags) => {
    setEditingTask(task);
    setCreateDialogInitialDate(null);
    setDialogOpen(true);
  }, []);

  const openCreateDialog = useCallback((initialDate?: string | null) => {
    setEditingTask(null);
    setCreateDialogInitialDate(initialDate ?? null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingTask(null);
    setCreateDialogInitialDate(null);
  }, []);

  const exportDataAction = useCallback(async () => {
    const data = await dbExportData();
    return JSON.stringify(data, null, 2);
  }, []);

  const importDataAction = useCallback(async (json: string) => {
    const data = JSON.parse(json);
    await dbImportData(data);
    await refreshLists();
    await refreshTags();
    await refreshTasks();
  }, [refreshLists, refreshTags, refreshTasks]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await seedSystemLists();
      await seedDemoTasks();
      if (mounted) {
        const savedTheme = await getSetting<ThemeMode>('theme', 'system');
        setThemeState(savedTheme);
        applyThemeClass(savedTheme);
        await refreshLists();
        await refreshTags();
        await refreshTasks();
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshLists, refreshTags, refreshTasks, applyThemeClass]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeClass('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme, applyThemeClass]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const value: AppContextValue = {
    lists,
    tags,
    tasks,
    selectedListId,
    viewMode,
    loading,
    dialogOpen,
    editingTask,
    createDialogInitialDate,
    searchQuery,
    theme,
    filterTags,
    filterPriorities,
    filterStatus,
    filterDueDateFrom,
    filterDueDateTo,
    filterQuadrant,
    refreshLists,
    refreshTags,
    refreshTasks,
    selectList,
    setViewMode: setViewModeAndReset,
    setSearchQuery,
    setTheme,
    setFilterTags,
    setFilterPriorities,
    setFilterStatus,
    setFilterDueDateFrom,
    setFilterDueDateTo,
    setFilterQuadrant,
    clearFilters,
    createTask,
    updateTask,
    moveTaskToList,
    toggleComplete: toggleCompleteAction,
    deleteTask: deleteTaskAction,
    restoreTask: restoreTaskAction,
    permanentDelete: permanentDeleteAction,
    emptyTrash: emptyTrashAction,
    createList,
    createSmartList: createSmartListAction,
    updateList,
    deleteList,
    createTag,
    updateTag,
    deleteTag,
    setTaskTags: setTaskTagsAction,
    createSubTask,
    updateSubTask,
    toggleSubTask,
    deleteSubTask,
    reorderTasks: reorderTasksAction,
    openEditDialog,
    openCreateDialog,
    closeDialog,
    exportData: exportDataAction,
    importData: importDataAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

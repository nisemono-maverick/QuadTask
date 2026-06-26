import { useState } from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AppProvider } from './stores/AppContext';
import { useApp } from './hooks/useApp';
import { useMediaQuery } from './hooks/useMediaQuery';
import { Sidebar } from './components/Sidebar';
import { QuickAdd } from './components/QuickAdd';
import { TaskList } from './components/TaskList';
import { QuadrantGrid } from './components/QuadrantGrid';
import { CalendarView } from './components/CalendarView';
import { GanttView } from './components/GanttView';
import { SettingsView } from './components/SettingsView';
import { FilterBar } from './components/FilterBar';
import { TaskDialog } from './components/TaskDialog';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Button } from './components/ui/Button';
import { cn } from './utils';

function AppContent() {
  const { viewMode, setSearchQuery, searchQuery, dialogOpen, closeDialog, editingTask, openCreateDialog, tasks, reorderTasks, moveTaskToList } = useApp();
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const closeSidebar = () => setSidebarOpen(false);

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

  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (overId.startsWith('list-')) {
      const listId = overId.replace('list-', '');
      await moveTaskToList(activeId, listId);
      return;
    }

    const oldIndex = activeTasks.findIndex((t) => t.id === activeId);
    const newIndex = activeTasks.findIndex((t) => t.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(activeTasks, oldIndex, newIndex);
      await reorderTasks(reordered.map((t) => t.id));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-screen w-full overflow-hidden bg-bg-secondary">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="shrink-0 w-60">
          <Sidebar />
        </aside>
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeSidebar}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-60 bg-bg-primary shadow-xl">
            <Sidebar onClose={closeSidebar} />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-border-default bg-bg-primary px-3 py-2 md:px-4">
          <div className="flex items-center justify-between gap-2">
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="shrink-0 px-2">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <QuickAdd className="max-w-xl flex-1" />
            </div>
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <div className={cn('flex items-center transition-all', showSearch ? 'w-40 md:w-64' : 'w-auto')}>
                {showSearch ? (
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索任务..."
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false);
                    }}
                    className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
                  />
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setShowSearch(true)} className="px-2 md:px-3">
                    <Search className="h-4 w-4 md:mr-1.5" />
                    <span className="hidden md:inline">搜索</span>
                  </Button>
                )}
              </div>
              <Button size="sm" onClick={() => openCreateDialog()} className="px-2 md:px-3">
                <Plus className="h-4 w-4 md:mr-1.5" />
                <span className="hidden md:inline">新建</span>
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <FilterBar />
          </div>
        </header>

        {/* Main content */}
        <main className={cn('flex-1', viewMode === 'quadrants' ? 'overflow-auto' : 'overflow-hidden')}>
          {viewMode === 'quadrants' && <QuadrantGrid />}
          {viewMode === 'list' && <TaskList />}
          {viewMode === 'calendar' && <CalendarView />}
          {viewMode === 'gantt' && <GanttView />}
          {viewMode === 'settings' && <SettingsView />}
        </main>
      </div>

      <TaskDialog open={dialogOpen} onClose={closeDialog} task={editingTask} />
      <PWAInstallPrompt />
    </div>
    </DndContext>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Check,
  Circle,
  Folder,
  FolderOpen,
  Undo2
} from "lucide-react";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* -------------------- date helpers -------------------- */

const today = () => new Date().toISOString().slice(0, 10);

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const isVisibleToday = task =>
  !task.hiddenUntil || task.hiddenUntil <= today();

/* -------------------- tree helpers -------------------- */

const reorderTasksByParent = (tasks, parentId, activeId, overId) => {
  if (parentId === null) {
    const oldIndex = tasks.findIndex(t => t.id === activeId);
    const newIndex = tasks.findIndex(t => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return tasks;

    return arrayMove(tasks, oldIndex, newIndex).map((t, i) => ({
      ...t,
      order: i,
    }));
  }

  return tasks.map(task => {
    if (task.id === parentId) {
      const oldIndex = task.tasks.findIndex(t => t.id === activeId);
      const newIndex = task.tasks.findIndex(t => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return task;

      return {
        ...task,
        tasks: arrayMove(task.tasks, oldIndex, newIndex).map((t, i) => ({
          ...t,
          order: i,
        })),
      };
    }

    return {
      ...task,
      tasks: reorderTasksByParent(
        task.tasks,
        parentId,
        activeId,
        overId
      ),
    };
  });
};

const addSubtaskById = (tasks, parentId, name) =>
  tasks.map(task => {
    if (task.id === parentId) {
      return {
        ...task,
        tasks: [
          ...task.tasks,
          {
            id: crypto.randomUUID(),
            name,
            order: task.tasks.length,
            hiddenUntil: null,
            completedDate: null,
            tasks: [],
          },
        ],
      };
    }

    return {
      ...task,
      tasks: addSubtaskById(task.tasks, parentId, name),
    };
  });

const deleteTaskById = (tasks, taskId) =>
  tasks
    .filter(task => task.id !== taskId)
    .map(task => ({
      ...task,
      tasks: deleteTaskById(task.tasks, taskId),
    }));

const toggleTaskCompletionById = (tasks, taskId) => {
  // Helper function to recursively set completion status for all children
  const setAllChildrenCompletion = (tasks, completedDate) =>
    tasks.map(task => ({
      ...task,
      completedDate,
      tasks: setAllChildrenCompletion(task.tasks, completedDate),
    }));

  return tasks.map(task => {
    if (task.id === taskId) {
      const newCompletedDate = task.completedDate ? null : today();
      return {
        ...task,
        completedDate: newCompletedDate,
        // Also update all children to have the same completion status
        tasks: setAllChildrenCompletion(task.tasks, newCompletedDate),
      };
    }

    return {
      ...task,
      tasks: toggleTaskCompletionById(task.tasks, taskId),
    };
  });
};

/* -------------------- Sortable wrapper -------------------- */

const Sortable = ({ id, children }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
};

/* -------------------- TaskItem -------------------- */

const TaskItem = ({
  task,
  onAddSubtask,
  onDelete,
  onToggleCompletion,
  onReorder,
  onToggleOpen,
  dragHandleProps,
  depth = 0,
}) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  // Task is open by default, stored in task.isOpen (defaults to true if undefined)
  const open = task.isOpen !== undefined ? task.isOpen : true;

  if (!isVisibleToday(task)) return null;

  const isCompleted = task.completedDate && task.completedDate === today();

  const submit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddSubtask(task.id, name);
    setName("");
    setAdding(false);
  };

  const hasSubtasks = task.tasks.length > 0;

  return (
    <div className="group/task">
      <Collapsible open={open} onOpenChange={(newOpen) => onToggleOpen(task.id, newOpen)}>
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </span>

          {hasSubtasks ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    open ? "" : "-rotate-90"
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6 flex items-center justify-center">
              <Circle className="h-3 w-3 text-muted-foreground/30" />
            </div>
          )}

          <span
            className={`text-sm flex-1 font-medium transition-all ${
              isCompleted ? 'line-through text-muted-foreground/60' : ''
            }`}
          >
            {task.name}
          </span>

          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 ${
                isCompleted
                  ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={() => onToggleCompletion(task.id)}
              title={isCompleted ? "Undo completion" : "Mark as done"}
            >
              {isCompleted ? (
                <Undo2 className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setAdding(v => !v)}
              title="Add subtask"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(task.id)}
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {adding && (
          <form onSubmit={submit} className="flex gap-2 mt-2 ml-12 mr-3 mb-2">
            <Input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Subtask name..."
              className="h-9 text-sm border-dashed"
              onBlur={() => {
                if (!name.trim()) setAdding(false);
              }}
            />
            <Button size="sm" className="h-9 px-4">
              Add
            </Button>
          </form>
        )}

        <CollapsibleContent>
          <div className="ml-6 mt-1 border-l-2 border-border/40 pl-3">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;
                onReorder(task.id, active.id, over.id);
              }}
            >
              <SortableContext
                items={task.tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {task.tasks
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map(child => (
                    <Sortable key={child.id} id={child.id}>
                      {({ attributes, listeners }) => (
                        <TaskItem
                          task={child}
                          onAddSubtask={onAddSubtask}
                          onDelete={onDelete}
                          onToggleCompletion={onToggleCompletion}
                          onReorder={onReorder}
                          onToggleOpen={onToggleOpen}
                          dragHandleProps={{ ...attributes, ...listeners }}
                          depth={depth + 1}
                        />
                      )}
                    </Sortable>
                  ))}
              </SortableContext>
            </DndContext>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

/* -------------------- GroupItem -------------------- */

const GroupItem = ({ group, setGroups, onDelete }) => {
  const [taskName, setTaskName] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);

  // Group is open by default, stored in group.isOpen (defaults to true if undefined)
  const isOpen = group.isOpen !== undefined ? group.isOpen : true;

  const addRootTask = e => {
    e.preventDefault();
    if (!taskName.trim()) return;

    setGroups(prev => {
      const next = prev.map(g =>
        g.id === group.id
          ? {
              ...g,
              tasks: [
                ...g.tasks,
                {
                  id: crypto.randomUUID(),
                  name: taskName,
                  order: g.tasks.length,
                  hiddenUntil: null,
                  completedDate: null,
                  isOpen: true,
                  tasks: [],
                },
              ],
            }
          : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });

    setTaskName("");
  };

  const updateTasks = updater =>
    setGroups(prev => {
      const next = prev.map(g =>
        g.id === group.id ? { ...g, tasks: updater(g.tasks) } : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });

  const toggleTaskOpen = (taskId, newOpen) => {
    const toggleOpenById = (tasks, targetId) =>
      tasks.map(task => {
        if (task.id === targetId) {
          return { ...task, isOpen: newOpen };
        }
        return {
          ...task,
          tasks: toggleOpenById(task.tasks, targetId),
        };
      });

    updateTasks(tasks => toggleOpenById(tasks, taskId));
  };

  const toggleGroupOpen = (newOpen) => {
    setGroups(prev => {
      const next = prev.map(g =>
        g.id === group.id ? { ...g, isOpen: newOpen } : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });
  };

  const saveGroupName = () => {
    if (!editedName.trim()) {
      setEditedName(group.name);
      setIsEditing(false);
      return;
    }

    setGroups(prev => {
      const next = prev.map(g =>
        g.id === group.id ? { ...g, name: editedName } : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });
    setIsEditing(false);
  };

  const visibleTaskCount = group.tasks.filter(isVisibleToday).length;

  return (
    <Sortable id={group.id}>
      {({ attributes, listeners }) => (
        <Card
          className="mb-4 border-2 overflow-hidden shadow-sm hover:shadow-md transition-all py-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          <Collapsible open={isOpen} onOpenChange={toggleGroupOpen}>
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center gap-3 px-4 py-3">
                <span
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <GripVertical className="h-5 w-5" />
                </span>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    {isOpen ? (
                      <FolderOpen className="h-5 w-5 text-primary" />
                    ) : (
                      <Folder className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                {isEditing ? (
                  <Input
                    autoFocus
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    onBlur={saveGroupName}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveGroupName();
                      if (e.key === 'Escape') {
                        setEditedName(group.name);
                        setIsEditing(false);
                      }
                    }}
                    className="h-8 font-semibold text-base flex-1"
                  />
                ) : (
                  <h3
                    className="font-semibold text-base flex-1 cursor-pointer hover:text-primary transition-colors"
                    onDoubleClick={() => setIsEditing(true)}
                  >
                    {group.name}
                  </h3>
                )}

                <div className="flex items-center gap-2">
                  {visibleTaskCount > 0 && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {visibleTaskCount} {visibleTaskCount === 1 ? 'task' : 'tasks'}
                    </span>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => onDelete(group.id)}
                    title="Delete group"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <CollapsibleContent>
              <CardContent className="pt-4 pb-4">
                <form onSubmit={addRootTask} className="flex gap-2 mb-4">
                  <Input
                    value={taskName}
                    onChange={e => setTaskName(e.target.value)}
                    placeholder="Add a new task..."
                    className="h-10 border-dashed"
                  />
                  <Button className="h-10 px-5">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </form>

                {group.tasks.filter(isVisibleToday).length > 0 ? (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (!over || active.id === over.id) return;
                      updateTasks(tasks =>
                        reorderTasksByParent(tasks, null, active.id, over.id)
                      );
                    }}
                  >
                    <SortableContext
                      items={group.tasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1">
                        {group.tasks
                          .slice()
                          .sort((a, b) => a.order - b.order)
                          .map(task => (
                            <Sortable key={task.id} id={task.id}>
                              {({ attributes, listeners }) => (
                                <TaskItem
                                  task={task}
                                  onAddSubtask={(id, name) =>
                                    updateTasks(tasks =>
                                      addSubtaskById(tasks, id, name)
                                    )
                                  }
                                  onDelete={id =>
                                    updateTasks(tasks =>
                                      deleteTaskById(tasks, id)
                                    )
                                  }
                                  onToggleCompletion={id =>
                                    updateTasks(tasks =>
                                      toggleTaskCompletionById(tasks, id)
                                    )
                                  }
                                  onReorder={(parentId, activeId, overId) =>
                                    updateTasks(tasks =>
                                      reorderTasksByParent(
                                        tasks,
                                        parentId,
                                        activeId,
                                        overId
                                      )
                                    )
                                  }
                                  onToggleOpen={toggleTaskOpen}
                                  dragHandleProps={{ ...attributes, ...listeners }}
                                />
                              )}
                            </Sortable>
                          ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No tasks yet. Add one above to get started.
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </Sortable>
  );
};

/* -------------------- App -------------------- */

export default function App() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("data");
    if (stored) setGroups(JSON.parse(stored));
  }, []);

  const createGroup = e => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setGroups(prev => {
      const next = [
        ...prev,
        { id: crypto.randomUUID(), name: groupName, isOpen: true, tasks: [] },
      ];
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });

    setGroupName("");
  };

  const deleteGroup = groupId => {
    setGroups(prev => {
      const next = prev.filter(g => g.id !== groupId);
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });
  };

  const reorderGroups = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setGroups(prev => {
      const oldIndex = prev.findIndex(g => g.id === active.id);
      const newIndex = prev.findIndex(g => g.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const next = arrayMove(prev, oldIndex, newIndex);
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">DaiBX</h1>
          <p className="text-slate-600">Organize your tasks into groups and stay productive</p>
        </div>

        <Card className="mb-6 shadow-md border-2">
          <CardContent>
            <form onSubmit={createGroup} className="flex gap-3">
              <Input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Create a new group..."
                className="h-11 text-base"
              />
              <Button className="h-11 px-6 text-base">
                <Plus className="h-5 w-5 mr-2" />
                Create Group
              </Button>
            </form>
          </CardContent>
        </Card>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={reorderGroups}
        >
          <SortableContext
            items={groups.map(g => g.id)}
            strategy={verticalListSortingStrategy}
          >
            {groups.length > 0 ? (
              groups.map(group => (
                <GroupItem
                  key={group.id}
                  group={group}
                  setGroups={setGroups}
                  onDelete={deleteGroup}
                />
              ))
            ) : (
              <div className="text-center py-16">
                <Folder className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No groups yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your first group above to start organizing your tasks
                </p>
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

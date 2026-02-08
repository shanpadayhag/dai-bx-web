"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Plus, Trash, GripVertical } from "lucide-react";

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

const hideTaskById = (tasks, taskId) =>
  tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, hiddenUntil: tomorrow() };
    }

    return {
      ...task,
      tasks: hideTaskById(task.tasks, taskId),
    };
  });

/* -------------------- Sortable wrapper -------------------- */

const Sortable = ({ id, children }) => {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ setActivatorNodeRef, attributes, listeners })}
    </div>
  );
};

/* -------------------- TaskItem -------------------- */

const TaskItem = ({
  task,
  onAddSubtask,
  onDelete,
  onHide,
  onReorder,
}) => {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!isVisibleToday(task)) return null;

  const submit = e => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddSubtask(task.id, name);
    setName("");
    setAdding(false);
    setOpen(true);
  };

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-1 py-1">
          <span className="cursor-grab text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </span>

          {task.tasks.length > 0 ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    open ? "rotate-90" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <span className="text-sm">{task.name}</span>

          <Button size="icon" variant="ghost" onClick={() => onHide(task.id)}>
            ✔
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setAdding(v => !v)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>

        {adding && (
          <form onSubmit={submit} className="ml-7 flex gap-2">
            <Input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="New subtask"
              className="h-8"
            />
            <Button size="sm">Add</Button>
          </form>
        )}

        <CollapsibleContent className="ml-4">
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
                    {({ setActivatorNodeRef, attributes, listeners }) => (
                      <div>
                        <div
                          ref={setActivatorNodeRef}
                          {...attributes}
                          {...listeners}
                          className="inline-block"
                        />
                        <TaskItem
                          task={child}
                          onAddSubtask={onAddSubtask}
                          onDelete={onDelete}
                          onHide={onHide}
                          onReorder={onReorder}
                        />
                      </div>
                    )}
                  </Sortable>
                ))}
            </SortableContext>
          </DndContext>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

/* -------------------- GroupItem -------------------- */

const GroupItem = ({ group, setGroups }) => {
  const [taskName, setTaskName] = useState("");

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

  return (
    <Sortable id={group.id}>
      {({ setActivatorNodeRef, attributes, listeners }) => (
        <Card className="mb-4 bg-muted/30">
          <CardHeader className="flex flex-row items-center gap-2">
            <span
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </span>
            <CardTitle className="text-sm">{group.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <form onSubmit={addRootTask} className="flex gap-2">
              <Input
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="Add task"
              />
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>

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
                {group.tasks
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map(task => (
                    <Sortable key={task.id} id={task.id}>
                      {({ setActivatorNodeRef, attributes, listeners }) => (
                        <div>
                          <div
                            ref={setActivatorNodeRef}
                            {...attributes}
                            {...listeners}
                            className="inline-block"
                          />
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
                            onHide={id =>
                              updateTasks(tasks => hideTaskById(tasks, id))
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
                          />
                        </div>
                      )}
                    </Sortable>
                  ))}
              </SortableContext>
            </DndContext>
          </CardContent>
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
        { id: crypto.randomUUID(), name: groupName, tasks: [] },
      ];
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });

    setGroupName("");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <form onSubmit={createGroup} className="flex gap-2">
        <Input
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="New group"
        />
        <Button>Create</Button>
      </form>

      <DndContext collisionDetection={closestCenter}>
        <SortableContext
          items={groups.map(g => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {groups.map(group => (
            <GroupItem
              key={group.id}
              group={group}
              setGroups={setGroups}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

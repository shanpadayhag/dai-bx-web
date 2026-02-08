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
import { ChevronRight, Plus, Trash } from "lucide-react";

/* -------------------- helpers -------------------- */

const addSubtaskById = (tasks, parentId, name) => {
  return tasks.map(task => {
    if (task.id === parentId) {
      return {
        ...task,
        tasks: [
          ...task.tasks,
          { id: crypto.randomUUID(), name, tasks: [] },
        ],
      };
    }

    return {
      ...task,
      tasks: addSubtaskById(task.tasks, parentId, name),
    };
  });
};

const deleteTaskById = (tasks, taskId) => {
  return tasks
    .filter(task => task.id !== taskId)
    .map(task => ({
      ...task,
      tasks: deleteTaskById(task.tasks, taskId),
    }));
};

/* -------------------- TaskItem (recursive tree) -------------------- */

const TaskItem = ({ task, onAddSubtask, onDelete }) => {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

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
        <div className="group flex items-center gap-1 py-1">
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

          <span className="text-sm leading-6">{task.name}</span>

          <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => setAdding(v => !v)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
            onClick={() => onDelete(task.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>

        {adding && (
          <form onSubmit={submit} className="ml-7 mb-1 flex gap-2">
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
          {task.tasks.map(child => (
            <TaskItem
              key={child.id}
              task={child}
              onAddSubtask={onAddSubtask}
              onDelete={onDelete}
            />
          ))}
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
                { id: crypto.randomUUID(), name: taskName, tasks: [] },
              ],
            }
          : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });

    setTaskName("");
  };

  const addSubtask = (taskId, name) => {
    setGroups(prev => {
      const next = prev.map(g =>
        g.id === group.id
          ? { ...g, tasks: addSubtaskById(g.tasks, taskId, name) }
          : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });
  };

  const deleteTask = taskId => {
    setGroups(prev => {
      const next = prev.map(g =>
        g.id === group.id
          ? { ...g, tasks: deleteTaskById(g.tasks, taskId) }
          : g
      );
      localStorage.setItem("data", JSON.stringify(next));
      return next;
    });
  };

  return (
    <Card className="border-muted bg-muted/30 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-wide">
          {group.name}
        </CardTitle>
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

        <div>
          {group.tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onAddSubtask={addSubtask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      </CardContent>
    </Card>
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

      {groups.map(group => (
        <GroupItem
          key={group.id}
          group={group}
          setGroups={setGroups}
        />
      ))}
    </div>
  );
}

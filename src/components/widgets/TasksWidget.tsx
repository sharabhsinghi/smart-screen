"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import type { Task } from "@/types";

const UNDO_WINDOW_MS = 60_000;

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Morning standup", time: "9:00 AM", done: false },
  { id: "2", title: "Review PRs", time: "10:30 AM", done: false },
  { id: "3", title: "Lunch with team", time: "12:00 PM", done: false },
  { id: "4", title: "Deploy to staging", time: "2:00 PM", done: false },
  { id: "5", title: "Weekly review", time: "4:00 PM", done: false },
];

function formatUndoTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const removalTimeoutsRef = useRef<Map<string, number>>(new Map());

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    const activeTimeouts = removalTimeoutsRef.current;

    for (const [taskId, timeoutId] of activeTimeouts.entries()) {
      const task = tasks.find((item) => item.id === taskId);
      if (task?.done && task.completedAt) {
        continue;
      }

      window.clearTimeout(timeoutId);
      activeTimeouts.delete(taskId);
    }

    for (const task of tasks) {
      if (!task.done || !task.completedAt || activeTimeouts.has(task.id)) {
        continue;
      }

      const delay = Math.max(task.completedAt + UNDO_WINDOW_MS - Date.now(), 0);
      const timeoutId = window.setTimeout(() => {
        removalTimeoutsRef.current.delete(task.id);
        setTasks((prev) => prev.filter((item) => item.id !== task.id));
      }, delay);

      activeTimeouts.set(task.id, timeoutId);
    }
  }, [tasks]);

  useEffect(() => {
    const activeTimeouts = removalTimeoutsRef.current;

    return () => {
      for (const timeoutId of activeTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      activeTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    if (!tasks.some((task) => task.done && task.completedAt)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [tasks]);

  const toggle = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) {
          return task;
        }

        if (task.done) {
          return { ...task, done: false, completedAt: undefined };
        }

        return { ...task, done: true, completedAt: Date.now() };
      })
    );
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: newTask.trim(),
        done: false,
      },
    ]);
    setNewTask("");
    setAdding(false);
  };

  const pending = tasks.filter((task) => !task.done).length;
  const orderedTasks = [...tasks].sort((left, right) => Number(left.done) - Number(right.done));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-white/60" />
          <span className="text-sm font-medium text-white/70">{today}</span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
          {pending} pending
        </span>
      </div>

      <div className="min-h-0 max-h-56 flex-1 space-y-1.5 overflow-y-auto pr-1 scrollbar-hide">
        {orderedTasks.map((task) => {
          const remainingMs = task.completedAt
            ? Math.max(0, task.completedAt + UNDO_WINDOW_MS - now)
            : 0;

          return (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className="group flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-white/10"
            >
              {task.done ? (
                <CheckCircle2 size={16} className="shrink-0 text-green-400" />
              ) : (
                <Circle size={16} className="shrink-0 text-white/40 group-hover:text-white/60" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${task.done ? "text-white/40 line-through" : "text-white/90"}`}>
                  {task.title}
                </p>
                {task.done && task.completedAt ? (
                  <p className="text-xs text-amber-200/80">
                    Tap to undo for {formatUndoTime(remainingMs)}
                  </p>
                ) : task.time ? (
                  <p className="text-xs text-white/40">{task.time}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/40"
            placeholder="Add task..."
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addTask();
              if (event.key === "Escape") setAdding(false);
            }}
          />
          <button
            onClick={addTask}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-sm transition-colors hover:bg-white/30"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <Plus size={14} /> Add task
        </button>
      )}
    </div>
  );
}
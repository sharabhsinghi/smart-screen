"use client";

import { useState } from "react";
import { CheckCircle2, Circle, CalendarDays, Plus } from "lucide-react";
import type { Task } from "@/types";

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Morning standup", time: "9:00 AM", done: false },
  { id: "2", title: "Review PRs", time: "10:30 AM", done: false },
  { id: "3", title: "Lunch with team", time: "12:00 PM", done: false },
  { id: "4", title: "Deploy to staging", time: "2:00 PM", done: false },
  { id: "5", title: "Weekly review", time: "4:00 PM", done: false },
];

export default function CalendarWidget() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const toggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
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

  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div className="flex flex-col h-full gap-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-white/60" />
          <span className="text-sm font-medium text-white/70">{today}</span>
        </div>
        <span className="text-xs bg-white/10 rounded-full px-2 py-0.5">
          {pending} pending
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
          >
            {task.done ? (
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            ) : (
              <Circle size={16} className="text-white/40 group-hover:text-white/60 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${task.done ? "line-through text-white/40" : "text-white/90"}`}>
                {task.title}
              </p>
              {task.time && (
                <p className="text-xs text-white/40">{task.time}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/20 focus:border-white/40 placeholder:text-white/30"
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <button
            onClick={addTask}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm transition-colors"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <Plus size={14} /> Add task
        </button>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Priority } from "../types";

interface TodoFormProps {
  onSubmit: (todo: {
    title: string;
    description: string;
    priority: Priority;
    dueDate: string;
  }) => void;
  notificationStatus?: {
    isSupported: boolean;
    permission: NotificationPermission;
  };
}

export default function TodoForm({
  onSubmit,
  notificationStatus,
}: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const scheduleNotification = (title: string, dueDate: string) => {
    const dueDateTime = new Date(dueDate).getTime();
    const currentTime = Date.now();
    const delay = dueDateTime - currentTime;
  
    if (delay > 0 && Notification.permission === "granted") {
      const intervals = [
        { time: 10 * 60 * 1000, message: "10 minutes left for the task" },
        { time: 5 * 60 * 1000, message: "5 minutes left for the task" },
        { time: 0, message: "It's time for the task" },
      ];
  
      intervals.forEach(({ time, message }) => {
        if (delay > time) {
          setTimeout(() => {
            new Notification("Task Reminder", {
              body: `${message}: ${title}`,
              icon: "/src/assets/media/icon.webp",
            });
            const audio = new Audio("/src/assets/media/notification.wav");
            audio.play();
          }, delay - time);
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const todo = { title, description, priority, dueDate };
      onSubmit(todo);

      scheduleNotification(title, dueDate);

      setLoading(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
    }, 1000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow-md"
    >
      {notificationStatus && (
        <div
          className={`flex items-center gap-2 text-sm mb-4 ${
            notificationStatus.permission === "granted"
              ? "text-green-600"
              : "text-yellow-600"
          }`}
        >
          <Bell size={16} />
          {notificationStatus.permission === "granted"
            ? "Reminders enabled"
            : "Please enable notifications for reminders"}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Task Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700"
          >
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700"
          >
            Due Date & Time
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        style={{ backgroundColor: "#02003d" }}
        disabled={loading}
      >
        {loading ? (
          <div className="w-5 h-5 border-4 border-t-4 border-white rounded-full animate-spin" />
        ) : (
          "Create Task"
        )}
      </button>
    </form>
  );
}

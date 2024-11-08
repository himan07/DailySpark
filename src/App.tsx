import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import { useNotifications } from './hooks/useNotifications';
import { Todo, Priority } from './types';

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });

  const notificationStatus = useNotifications(todos);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Handle new todo creation
  const handleCreateTodo = ({
    title,
    description,
    priority,
    dueDate,
  }: {
    title: string;
    description: string;
    priority: Priority;
    dueDate: string;
  }) => {
    const newTodo: Todo = {
      id: Date.now().toString(), 
      title,
      description,
      priority,
      dueDate,
      completed: false,
    };
    setTodos((prevTodos) => [...prevTodos, newTodo]);
  };

  // Handle toggling completion status
  const handleToggleComplete = (id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Handle deletion of a todo
  const handleDelete = (id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-2" style={{fontFamily:"inherit"}}>
                <Clock className="h-8 w-8 text-blue-600" />
                DailySpark: Ignite your productivity with timely reminders
              </h3>
            </div>
            <TodoForm 
              onSubmit={handleCreateTodo}
              notificationStatus={notificationStatus} 
            />
          </div>

          {todos.length > 0 ? (
            <TodoList
              todos={todos}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new task above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

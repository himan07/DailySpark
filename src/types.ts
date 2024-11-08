export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
}

export type Priority = 'low' | 'medium' | 'high';
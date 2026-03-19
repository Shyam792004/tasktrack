export interface Task {
    id: string;
    title: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
}

export const initialTasks: Task[] = [
    { id: '1', title: 'Design Dashboard UI', completed: false, priority: 'high', dueDate: new Date().toISOString() },
    { id: '2', title: 'Review Pull Requests', completed: false, priority: 'medium', dueDate: new Date().toISOString() },
    { id: '3', title: 'Update dependencies', completed: true, priority: 'low', dueDate: new Date().toISOString() },
];

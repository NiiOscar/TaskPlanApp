import React, { useState } from 'react';
import { Task } from '../types';
import { useTask } from '../contexts/TaskContext';
import { 
  X, 
  Calendar, 
  Flag, 
  User, 
  MessageSquare, 
  Users,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  Clock,
  Star
} from 'lucide-react';
import TaskCollaboration from './TaskCollaboration';
import EditTaskModal from './EditTaskModal';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
  const { updateTask, deleteTask, toggleTask, projects } = useTask();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'collaboration'>('details');

  const project = projects.find(p => p.id === task.projectId);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const priorityColors = {
    low: 'text-green-300 bg-green-500/20 border-green-400/30',
    medium: 'text-yellow-300 bg-yellow-500/20 border-yellow-400/30',
    high: 'text-red-300 bg-red-500/20 border-red-400/30',
  };

  const statusColors = {
    todo: 'text-slate-300 bg-slate-500/20 border-slate-400/30',
    'in-progress': 'text-blue-300 bg-blue-500/20 border-blue-400/30',
    review: 'text-amber-300 bg-amber-500/20 border-amber-400/30',
    done: 'text-green-300 bg-green-500/20 border-green-400/30',
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleTaskUpdate = (updates: Partial<Task>) => {
    updateTask(task.id, updates);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  if (showEdit) {
    return (
      <EditTaskModal
        task={task}
        onClose={() => setShowEdit(false)}
        onSave={() => setShowEdit(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0 transition-colors duration-200"
                >
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-white/60 hover:text-blue-400" />
                  )}
                </button>
                <h1 className={`text-2xl font-bold ${task.completed ? 'line-through text-white/50' : 'text-white'}`}>
                  {task.title}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${priorityColors[task.priority]}`}>
                  {task.priority} priority
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColors[task.status]}`}>
                  {task.status.replace('-', ' ')}
                </span>
                {isOverdue && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-500/20 text-red-300 border border-red-400/30">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setShowEdit(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                <Edit size={20} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Task Details
            </button>
            <button
              onClick={() => setActiveTab('collaboration')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'collaboration'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Collaboration
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-white/90 leading-relaxed">{task.description}</p>
                  </div>
                </div>
              )}

              {/* Task Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                {task.dueDate && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h4 className="font-medium text-white">Due Date</h4>
                    </div>
                    <p className={`text-sm ${isOverdue ? 'text-red-300' : 'text-white/80'}`}>
                      {formatDate(new Date(task.dueDate))}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-red-400 mt-1">
                        {Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </p>
                    )}
                  </div>
                )}

                {/* Project */}
                {project && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="font-medium text-white">Project</h4>
                    </div>
                    <p className="text-sm text-white/80">{project.name}</p>
                  </div>
                )}

                {/* Created Date */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium text-white">Created</h4>
                  </div>
                  <p className="text-sm text-white/80">{formatDate(task.createdAt)}</p>
                </div>

                {/* Last Updated */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <Edit className="w-5 h-5 text-green-400" />
                    <h4 className="font-medium text-white">Last Updated</h4>
                  </div>
                  <p className="text-sm text-white/80">{formatDate(task.updatedAt)}</p>
                </div>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-400/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {task.subtasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      Subtasks ({completedSubtasks}/{totalSubtasks})
                    </h3>
                    <span className="text-sm text-white/60">
                      {Math.round(subtaskProgress)}% complete
                    </span>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>

                    {/* Subtasks List */}
                    <div className="space-y-3">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            subtask.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-white/30'
                          }`}>
                            {subtask.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className={`flex-1 text-sm ${
                            subtask.completed ? 'line-through text-white/50' : 'text-white/90'
                          }`}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <TaskCollaboration task={task} onTaskUpdate={handleTaskUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
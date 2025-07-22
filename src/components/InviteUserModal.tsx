import React, { useState } from 'react';
import { X, Mail, UserPlus, Send, Crown, Edit, Shield, Eye } from 'lucide-react';
import { Task } from '../types';
import { TaskCollaborator } from '../types/collaboration';
import { collaborationService } from '../services/collaborationService';
import { useAuth } from '../contexts/AuthContext';

interface InviteUserModalProps {
  task: Task;
  onClose: () => void;
  onInvite: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ task, onClose, onInvite }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    role: 'editor' as TaskCollaborator['role'],
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    {
      value: 'owner',
      label: 'Owner',
      description: 'Full access including deletion',
      icon: Crown,
      color: 'text-yellow-400'
    },
    {
      value: 'editor',
      label: 'Editor',
      description: 'Can edit task and invite others',
      icon: Edit,
      color: 'text-blue-400'
    },
    {
      value: 'reviewer',
      label: 'Reviewer',
      description: 'Can comment and review',
      icon: Shield,
      color: 'text-purple-400'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Read-only access',
      icon: Eye,
      color: 'text-gray-400'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !user) return;

    setIsLoading(true);
    setError('');

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      await collaborationService.inviteUserToTask(
        task.id,
        task.title,
        user.id,
        user.name,
        formData.email,
        formData.role,
        formData.message || undefined
      );

      onInvite();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite Collaborator</h2>
                <p className="text-sm text-white/60">Invite someone to collaborate on "{task.title}"</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white placeholder-white/60"
                placeholder="Enter email address..."
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Role *
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                    formData.role === role.value
                      ? 'bg-blue-500/20 border-blue-400/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <role.icon className={`w-5 h-5 ${role.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-white">{role.label}</div>
                    <div className="text-sm text-white/60">{role.description}</div>
                  </div>
                  {formData.role === role.value && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white placeholder-white/60 resize-none"
              rows={3}
              placeholder="Add a personal message to your invitation..."
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.email.trim() || isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 text-white rounded-lg hover:from-blue-500 hover:to-indigo-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
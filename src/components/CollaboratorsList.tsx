import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Edit, 
  Shield, 
  Eye, 
  MoreHorizontal, 
  UserMinus,
  Settings,
  Mail
} from 'lucide-react';
import { TaskCollaborator } from '../types/collaboration';
import { collaborationService } from '../services/collaborationService';
import { useAuth } from '../contexts/AuthContext';

interface CollaboratorsListProps {
  taskId: string;
  collaborators: TaskCollaborator[];
  onUpdate: () => void;
  canManage?: boolean;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ 
  taskId, 
  collaborators, 
  onUpdate, 
  canManage = false 
}) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRoleIcon = (role: TaskCollaborator['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'reviewer':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-400" />;
      default:
        return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: TaskCollaborator['role']) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'editor':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'reviewer':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const handleRoleChange = async (collaboratorId: string, newRole: TaskCollaborator['role']) => {
    setIsLoading(true);
    try {
      await collaborationService.updateCollaboratorRole(collaboratorId, newRole);
      onUpdate();
      setShowMenu(null);
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;
    
    setIsLoading(true);
    try {
      await collaborationService.removeCollaborator(taskId, collaboratorId, user?.id || '');
      onUpdate();
      setShowMenu(null);
    } catch (error) {
      console.error('Error removing collaborator:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Collaborators ({collaborators.length})
        </h4>
      </div>

      <div className="space-y-2">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {collaborator.userId.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white text-sm">
                    {collaborator.userId}
                  </span>
                  {collaborator.userId === user?.id && (
                    <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(collaborator.role)}`}>
                    {getRoleIcon(collaborator.role)}
                    <span className="ml-1">{collaborator.role}</span>
                  </span>
                  <span className="text-xs text-white/60">
                    Joined {formatJoinDate(collaborator.acceptedAt || collaborator.invitedAt)}
                  </span>
                </div>
              </div>
            </div>

            {canManage && collaborator.userId !== user?.id && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === collaborator.id ? null : collaborator.id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  disabled={isLoading}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu === collaborator.id && (
                  <div className="absolute right-0 top-10 w-48 bg-white/10 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 z-20">
                    <div className="p-2">
                      <div className="text-xs text-white/60 px-2 py-1 mb-1">Change Role</div>
                      {(['owner', 'editor', 'reviewer', 'viewer'] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(collaborator.id, role)}
                          disabled={role === collaborator.role || isLoading}
                          className={`w-full flex items-center space-x-2 px-2 py-2 text-left text-sm rounded hover:bg-white/10 transition-colors ${
                            role === collaborator.role 
                              ? 'text-white/50 cursor-not-allowed' 
                              : 'text-white/80 hover:text-white'
                          }`}
                        >
                          {getRoleIcon(role)}
                          <span className="capitalize">{role}</span>
                          {role === collaborator.role && (
                            <span className="ml-auto text-xs text-green-400">Current</span>
                          )}
                        </button>
                      ))}
                      
                      <div className="border-t border-white/10 my-1"></div>
                      
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        disabled={isLoading}
                        className="w-full flex items-center space-x-2 px-2 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {collaborators.length === 0 && (
        <div className="text-center py-6 text-white/60">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No collaborators yet</p>
          <p className="text-xs">Invite team members to collaborate on this task</p>
        </div>
      )}
    </div>
  );
};

export default CollaboratorsList;
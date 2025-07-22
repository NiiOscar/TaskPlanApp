import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Users, 
  MessageSquare, 
  Star, 
  UserPlus, 
  Check, 
  X, 
  Eye,
  Clock,
  Mail
} from 'lucide-react';
import { CollaborationNotification, TaskInvitation } from '../types/collaboration';
import { collaborationService } from '../services/collaborationService';
import { useAuth } from '../contexts/AuthContext';

interface CollaborationNotificationsProps {
  onClose: () => void;
}

const CollaborationNotifications: React.FC<CollaborationNotificationsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);
  const [invitations, setInvitations] = useState<TaskInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'invitations'>('notifications');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    setNotifications(collaborationService.getUserNotifications(user.id));
    setInvitations(collaborationService.getUserInvitations(user.id));
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await collaborationService.acceptInvitation(invitationId, user.id);
      loadData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setIsLoading(true);
    try {
      await collaborationService.declineInvitation(invitationId);
      loadData();
    } catch (error) {
      console.error('Error declining invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await collaborationService.markNotificationAsRead(notificationId);
    loadData();
  };

  const getNotificationIcon = (type: CollaborationNotification['type']) => {
    switch (type) {
      case 'task_invitation':
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      case 'comment_mention':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      case 'task_updated':
        return <Bell className="w-5 h-5 text-green-400" />;
      case 'review_requested':
        return <Star className="w-5 h-5 text-yellow-400" />;
      case 'review_completed':
        return <Star className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/20">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Collaboration Center</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1 mt-4">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'invitations'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Invitations
              {pendingInvitations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                  {pendingInvitations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-96">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        notification.read
                          ? 'bg-white/5 border-white/10'
                          : 'bg-blue-500/10 border-blue-400/30'
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                          <p className="text-white/70 text-sm mt-1">{notification.message}</p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-white/50">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {!notification.read && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/60">
                  <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              )}
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="p-6">
              {invitations.length > 0 ? (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <h4 className="font-medium text-white text-sm">
                              Task Collaboration Invitation
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              invitation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                              invitation.status === 'accepted' ? 'bg-green-500/20 text-green-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {invitation.status}
                            </span>
                          </div>
                          
                          <p className="text-white/80 text-sm mb-2">
                            <span className="font-medium">{invitation.inviterName}</span> invited you to collaborate on{' '}
                            <span className="font-medium">"{invitation.taskTitle}"</span> as{' '}
                            <span className="font-medium">{invitation.role}</span>
                          </p>
                          
                          {invitation.message && (
                            <div className="bg-white/5 rounded-lg p-3 mb-3 border border-white/10">
                              <p className="text-white/70 text-sm italic">"{invitation.message}"</p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 text-xs text-white/50">
                            <span>Invited {formatTimeAgo(invitation.createdAt)}</span>
                            <span>•</span>
                            <span>Expires {formatTimeAgo(invitation.expiresAt)}</span>
                          </div>
                        </div>
                      </div>

                      {invitation.status === 'pending' && (
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-white/60">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No invitations</p>
                  <p className="text-sm">You don't have any pending invitations</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 text-white rounded-lg hover:from-blue-500 hover:to-indigo-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationNotifications;
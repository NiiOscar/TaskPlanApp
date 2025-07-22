import { useState, useEffect } from 'react';
import { collaborationService } from '../services/collaborationService';
import { 
  TaskCollaborator, 
  TaskComment, 
  TaskActivity, 
  TaskReview, 
  CollaborationNotification,
  TaskInvitation 
} from '../types/collaboration';

export const useCollaboration = (userId: string) => {
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);
  const [invitations, setInvitations] = useState<TaskInvitation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      loadData();
      
      // Set up polling for real-time updates (in production, use WebSockets)
      const interval = setInterval(loadData, 30000); // Poll every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadData = () => {
    const userNotifications = collaborationService.getUserNotifications(userId);
    const userInvitations = collaborationService.getUserInvitations(userId);
    const unread = collaborationService.getUnreadNotificationsCount(userId);
    
    setNotifications(userNotifications);
    setInvitations(userInvitations);
    setUnreadCount(unread);
  };

  const markAsRead = async (notificationId: string) => {
    await collaborationService.markNotificationAsRead(notificationId);
    loadData();
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      await collaborationService.acceptInvitation(invitationId, userId);
      loadData();
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      await collaborationService.declineInvitation(invitationId);
      loadData();
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      return false;
    }
  };

  const getTaskCollaborators = (taskId: string): TaskCollaborator[] => {
    return collaborationService.getTaskCollaborators(taskId);
  };

  const getTaskComments = (taskId: string): TaskComment[] => {
    return collaborationService.getTaskComments(taskId);
  };

  const getTaskActivities = (taskId: string): TaskActivity[] => {
    return collaborationService.getTaskActivities(taskId);
  };

  const getTaskReviews = (taskId: string): TaskReview[] => {
    return collaborationService.getTaskReviews(taskId);
  };

  const canEditTask = (taskId: string): boolean => {
    return collaborationService.canUserEditTask(taskId, userId);
  };

  const canCommentOnTask = (taskId: string): boolean => {
    return collaborationService.canUserCommentOnTask(taskId, userId);
  };

  const canInviteToTask = (taskId: string): boolean => {
    return collaborationService.canUserInviteToTask(taskId, userId);
  };

  const canDeleteTask = (taskId: string): boolean => {
    return collaborationService.canUserDeleteTask(taskId, userId);
  };

  return {
    notifications,
    invitations,
    unreadCount,
    markAsRead,
    acceptInvitation,
    declineInvitation,
    getTaskCollaborators,
    getTaskComments,
    getTaskActivities,
    getTaskReviews,
    canEditTask,
    canCommentOnTask,
    canInviteToTask,
    canDeleteTask,
    refreshData: loadData
  };
};
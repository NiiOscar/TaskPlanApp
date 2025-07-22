import { Task } from '../types';
import { 
  TaskCollaborator, 
  TaskComment, 
  TaskInvitation, 
  TaskActivity, 
  TaskReview, 
  CollaborationNotification,
  TaskAttachment,
  TaskReaction
} from '../types/collaboration';

class CollaborationService {
  private collaborators: TaskCollaborator[] = [];
  private comments: TaskComment[] = [];
  private invitations: TaskInvitation[] = [];
  private activities: TaskActivity[] = [];
  private reviews: TaskReview[] = [];
  private notifications: CollaborationNotification[] = [];

  // Task Collaboration Management
  async inviteUserToTask(
    taskId: string, 
    taskTitle: string,
    inviterUserId: string, 
    inviterName: string,
    inviteeEmail: string, 
    role: TaskCollaborator['role'],
    message?: string
  ): Promise<TaskInvitation> {
    const invitation: TaskInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      taskTitle,
      inviterUserId,
      inviterName,
      inviteeEmail,
      role,
      message,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.invitations.push(invitation);

    // Create notification for invitee (if they're a registered user)
    this.createNotification({
      userId: inviteeEmail, // In real app, would resolve email to userId
      type: 'task_invitation',
      title: 'Task Invitation',
      message: `${inviterName} invited you to collaborate on "${taskTitle}"`,
      taskId,
      invitationId: invitation.id,
    });

    // Log activity
    this.logActivity({
      taskId,
      userId: inviterUserId,
      userName: inviterName,
      type: 'invited',
      description: `invited ${inviteeEmail} as ${role}`,
    });

    console.log('✅ Task invitation sent:', invitation);
    return invitation;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<TaskCollaborator> {
    const invitation = this.invitations.find(inv => inv.id === invitationId);
    if (!invitation || invitation.status !== 'pending') {
      throw new Error('Invalid or expired invitation');
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.inviteeUserId = userId;

    // Create collaborator
    const collaborator: TaskCollaborator = {
      id: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      taskId: invitation.taskId,
      role: invitation.role,
      invitedBy: invitation.inviterUserId,
      invitedAt: invitation.createdAt,
      acceptedAt: new Date(),
      status: 'accepted',
      permissions: this.getRolePermissions(invitation.role),
    };

    this.collaborators.push(collaborator);

    // Log activity
    this.logActivity({
      taskId: invitation.taskId,
      userId,
      userName: invitation.inviteeEmail.split('@')[0], // Simplified
      type: 'joined',
      description: `joined as ${invitation.role}`,
    });

    console.log('✅ Invitation accepted:', collaborator);
    return collaborator;
  }

  async declineInvitation(invitationId: string): Promise<void> {
    const invitation = this.invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    invitation.status = 'declined';
    console.log('✅ Invitation declined:', invitationId);
  }

  private getRolePermissions(role: TaskCollaborator['role']): TaskCollaborator['permissions'] {
    switch (role) {
      case 'owner':
        return {
          canEdit: true,
          canComment: true,
          canInvite: true,
          canDelete: true,
          canChangeStatus: true,
        };
      case 'editor':
        return {
          canEdit: true,
          canComment: true,
          canInvite: true,
          canDelete: false,
          canChangeStatus: true,
        };
      case 'reviewer':
        return {
          canEdit: false,
          canComment: true,
          canInvite: false,
          canDelete: false,
          canChangeStatus: false,
        };
      case 'viewer':
        return {
          canEdit: false,
          canComment: true,
          canInvite: false,
          canDelete: false,
          canChangeStatus: false,
        };
      default:
        return {
          canEdit: false,
          canComment: false,
          canInvite: false,
          canDelete: false,
          canChangeStatus: false,
        };
    }
  }

  // Comments Management
  async addComment(
    taskId: string,
    userId: string,
    userName: string,
    content: string,
    type: TaskComment['type'] = 'comment',
    parentId?: string,
    mentions: string[] = []
  ): Promise<TaskComment> {
    const comment: TaskComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      userId,
      userName,
      content,
      type,
      parentId,
      mentions,
      attachments: [],
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
    };

    this.comments.push(comment);

    // Create notifications for mentioned users
    mentions.forEach(mentionedUserId => {
      this.createNotification({
        userId: mentionedUserId,
        type: 'comment_mention',
        title: 'You were mentioned',
        message: `${userName} mentioned you in a comment`,
        taskId,
        commentId: comment.id,
      });
    });

    // Log activity
    this.logActivity({
      taskId,
      userId,
      userName,
      type: 'commented',
      description: `added a comment`,
    });

    console.log('✅ Comment added:', comment);
    return comment;
  }

  async updateComment(commentId: string, content: string): Promise<TaskComment> {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.content = content;
    comment.updatedAt = new Date();
    comment.editedAt = new Date();
    comment.isEdited = true;

    console.log('✅ Comment updated:', comment);
    return comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const index = this.comments.findIndex(c => c.id === commentId);
    if (index >= 0) {
      this.comments.splice(index, 1);
      console.log('✅ Comment deleted:', commentId);
    }
  }

  async addReaction(commentId: string, userId: string, userName: string, emoji: string): Promise<void> {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Remove existing reaction from this user
    comment.reactions = comment.reactions.filter(r => r.userId !== userId);

    // Add new reaction
    comment.reactions.push({
      id: `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      emoji,
      createdAt: new Date(),
    });

    console.log('✅ Reaction added:', emoji);
  }

  // Reviews Management
  async submitReview(
    taskId: string,
    reviewerId: string,
    reviewerName: string,
    status: TaskReview['status'],
    feedback: string,
    rating?: number,
    suggestions: string[] = []
  ): Promise<TaskReview> {
    const review: TaskReview = {
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      reviewerId,
      reviewerName,
      status,
      rating,
      feedback,
      suggestions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.push(review);

    // Notify task owner and collaborators
    const taskCollaborators = this.getTaskCollaborators(taskId);
    taskCollaborators.forEach(collaborator => {
      if (collaborator.userId !== reviewerId) {
        this.createNotification({
          userId: collaborator.userId,
          type: 'review_completed',
          title: 'Review Completed',
          message: `${reviewerName} completed a review for the task`,
          taskId,
        });
      }
    });

    // Log activity
    this.logActivity({
      taskId,
      userId: reviewerId,
      userName: reviewerName,
      type: 'commented',
      description: `submitted a ${status} review`,
    });

    console.log('✅ Review submitted:', review);
    return review;
  }

  async requestReview(taskId: string, requesterId: string, requesterName: string, reviewerId: string): Promise<void> {
    // Create notification for reviewer
    this.createNotification({
      userId: reviewerId,
      type: 'review_requested',
      title: 'Review Requested',
      message: `${requesterName} requested your review on a task`,
      taskId,
    });

    // Log activity
    this.logActivity({
      taskId,
      userId: requesterId,
      userName: requesterName,
      type: 'commented',
      description: `requested a review`,
    });

    console.log('✅ Review requested');
  }

  // Activity Logging
  private logActivity(activity: Omit<TaskActivity, 'id' | 'createdAt'>): TaskActivity {
    const newActivity: TaskActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.activities.push(newActivity);
    return newActivity;
  }

  // Notifications
  private createNotification(notification: Omit<CollaborationNotification, 'id' | 'read' | 'createdAt'>): void {
    const newNotification: CollaborationNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.push(newNotification);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Getters
  getTaskCollaborators(taskId: string): TaskCollaborator[] {
    return this.collaborators.filter(c => c.taskId === taskId && c.status === 'accepted');
  }

  getTaskComments(taskId: string): TaskComment[] {
    return this.comments
      .filter(c => c.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getTaskActivities(taskId: string): TaskActivity[] {
    return this.activities
      .filter(a => a.taskId === taskId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTaskReviews(taskId: string): TaskReview[] {
    return this.reviews
      .filter(r => r.taskId === taskId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUserInvitations(userId: string): TaskInvitation[] {
    return this.invitations.filter(inv => 
      inv.inviteeUserId === userId || inv.inviteeEmail === userId
    );
  }

  getUserNotifications(userId: string): CollaborationNotification[] {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadNotificationsCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.read).length;
  }

  // Permission checks
  canUserEditTask(taskId: string, userId: string): boolean {
    const collaborator = this.collaborators.find(c => 
      c.taskId === taskId && c.userId === userId && c.status === 'accepted'
    );
    return collaborator?.permissions.canEdit || false;
  }

  canUserCommentOnTask(taskId: string, userId: string): boolean {
    const collaborator = this.collaborators.find(c => 
      c.taskId === taskId && c.userId === userId && c.status === 'accepted'
    );
    return collaborator?.permissions.canComment || false;
  }

  canUserInviteToTask(taskId: string, userId: string): boolean {
    const collaborator = this.collaborators.find(c => 
      c.taskId === taskId && c.userId === userId && c.status === 'accepted'
    );
    return collaborator?.permissions.canInvite || false;
  }

  canUserDeleteTask(taskId: string, userId: string): boolean {
    const collaborator = this.collaborators.find(c => 
      c.taskId === taskId && c.userId === userId && c.status === 'accepted'
    );
    return collaborator?.permissions.canDelete || false;
  }

  // Remove collaborator
  async removeCollaborator(taskId: string, collaboratorId: string, removedBy: string): Promise<void> {
    const collaborator = this.collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    collaborator.status = 'declined'; // Mark as removed

    // Log activity
    this.logActivity({
      taskId,
      userId: removedBy,
      userName: 'User', // In real app, get actual name
      type: 'left',
      description: `removed ${collaborator.userId} from the task`,
    });

    console.log('✅ Collaborator removed:', collaboratorId);
  }

  // Update collaborator role
  async updateCollaboratorRole(collaboratorId: string, newRole: TaskCollaborator['role']): Promise<void> {
    const collaborator = this.collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    collaborator.role = newRole;
    collaborator.permissions = this.getRolePermissions(newRole);

    console.log('✅ Collaborator role updated:', collaborator);
  }

  // Clear all data for a user (for cleanup)
  clearUserData(userId: string): void {
    this.collaborators = this.collaborators.filter(c => c.userId !== userId);
    this.comments = this.comments.filter(c => c.userId !== userId);
    this.invitations = this.invitations.filter(inv => inv.inviterUserId !== userId);
    this.activities = this.activities.filter(a => a.userId !== userId);
    this.reviews = this.reviews.filter(r => r.reviewerId !== userId);
    this.notifications = this.notifications.filter(n => n.userId !== userId);
  }
}

export const collaborationService = new CollaborationService();
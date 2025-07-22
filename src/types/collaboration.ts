export interface TaskCollaborator {
  id: string;
  userId: string;
  taskId: string;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'declined';
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canInvite: boolean;
    canDelete: boolean;
    canChangeStatus: boolean;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'comment' | 'review' | 'system';
  parentId?: string; // For replies
  mentions: string[]; // User IDs mentioned in the comment
  attachments: TaskAttachment[];
  reactions: TaskReaction[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isEdited: boolean;
}

export interface TaskReaction {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'link';
  size?: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskInvitation {
  id: string;
  taskId: string;
  taskTitle: string;
  inviterUserId: string;
  inviterName: string;
  inviteeEmail: string;
  inviteeUserId?: string;
  role: TaskCollaborator['role'];
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'created' | 'updated' | 'completed' | 'commented' | 'invited' | 'joined' | 'left' | 'status_changed' | 'priority_changed' | 'due_date_changed';
  description: string;
  metadata?: any;
  createdAt: Date;
}

export interface TaskReview {
  id: string;
  taskId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  rating?: number; // 1-5 stars
  feedback: string;
  suggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationNotification {
  id: string;
  userId: string;
  type: 'task_invitation' | 'comment_mention' | 'task_updated' | 'review_requested' | 'review_completed';
  title: string;
  message: string;
  taskId?: string;
  invitationId?: string;
  commentId?: string;
  read: boolean;
  createdAt: Date;
}
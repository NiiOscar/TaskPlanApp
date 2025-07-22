import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Star, 
  Send, 
  UserPlus, 
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Smile,
  Edit,
  Trash2,
  Reply,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Crown,
  Shield,
  User
} from 'lucide-react';
import { Task } from '../types';
import { 
  TaskCollaborator, 
  TaskComment, 
  TaskActivity, 
  TaskReview 
} from '../types/collaboration';
import { collaborationService } from '../services/collaborationService';
import { useAuth } from '../contexts/AuthContext';
import InviteUserModal from './InviteUserModal';
import CollaboratorsList from './CollaboratorsList';

interface TaskCollaborationProps {
  task: Task;
  onTaskUpdate: (updates: Partial<Task>) => void;
}

const TaskCollaboration: React.FC<TaskCollaborationProps> = ({ task, onTaskUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'reviews'>('comments');
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [reviews, setReviews] = useState<TaskReview[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved' as TaskReview['status'],
    feedback: '',
    rating: 5,
    suggestions: [] as string[]
  });

  useEffect(() => {
    loadCollaborationData();
  }, [task.id]);

  const loadCollaborationData = () => {
    setCollaborators(collaborationService.getTaskCollaborators(task.id));
    setComments(collaborationService.getTaskComments(task.id));
    setActivities(collaborationService.getTaskActivities(task.id));
    setReviews(collaborationService.getTaskReviews(task.id));
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      await collaborationService.addComment(
        task.id,
        user.id,
        user.name,
        newComment,
        'comment',
        replyingTo || undefined
      );
      
      setNewComment('');
      setReplyingTo(null);
      loadCollaborationData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await collaborationService.updateComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
      loadCollaborationData();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await collaborationService.deleteComment(commentId);
      loadCollaborationData();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;

    try {
      await collaborationService.addReaction(commentId, user.id, user.name, emoji);
      loadCollaborationData();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewData.feedback.trim()) return;

    try {
      await collaborationService.submitReview(
        task.id,
        user.id,
        user.name,
        reviewData.status,
        reviewData.feedback,
        reviewData.rating,
        reviewData.suggestions
      );
      
      setShowReviewForm(false);
      setReviewData({
        status: 'approved',
        feedback: '',
        rating: 5,
        suggestions: []
      });
      loadCollaborationData();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

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
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityIcon = (type: TaskActivity['type']) => {
    switch (type) {
      case 'created':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'updated':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'commented':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'invited':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'joined':
        return <Users className="w-4 h-4 text-green-400" />;
      case 'left':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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

  const canUserEdit = user ? collaborationService.canUserEditTask(task.id, user.id) : false;
  const canUserComment = user ? collaborationService.canUserCommentOnTask(task.id, user.id) : false;
  const canUserInvite = user ? collaborationService.canUserInviteToTask(task.id, user.id) : false;

  return (
    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Collaboration
          </h3>
          {canUserInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors border border-blue-400/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite</span>
            </button>
          )}
        </div>

        {/* Collaborators */}
        <CollaboratorsList
          taskId={task.id}
          collaborators={collaborators}
          onUpdate={loadCollaborationData}
          canManage={canUserInvite}
        />

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
          {[
            { id: 'comments', label: 'Comments', count: comments.length },
            { id: 'activity', label: 'Activity', count: activities.length },
            { id: 'reviews', label: 'Reviews', count: reviews.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Comment Input */}
            {canUserComment && (
              <div className="space-y-3">
                {replyingTo && (
                  <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg border border-blue-400/30">
                    <span className="text-sm text-blue-300">
                      Replying to comment
                    </span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white placeholder-white/60 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex space-x-2">
                        <button className="text-white/60 hover:text-white/80 text-sm">
                          @ Mention
                        </button>
                        <button className="text-white/60 hover:text-white/80 text-sm">
                          📎 Attach
                        </button>
                      </div>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {comment.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white text-sm">
                                {comment.userName}
                              </span>
                              <span className="text-xs text-white/60">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                              {comment.isEdited && (
                                <span className="text-xs text-white/40">(edited)</span>
                              )}
                            </div>
                            {user?.id === comment.userId && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingComment(comment.id);
                                    setEditContent(comment.content);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 hover:bg-white/10 rounded text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {editingComment === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white resize-none"
                                rows={2}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditComment(comment.id)}
                                  className="px-3 py-1 bg-blue-500/80 text-white rounded text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingComment(null);
                                    setEditContent('');
                                  }}
                                  className="px-3 py-1 bg-white/10 text-white/80 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-white/90 text-sm">{comment.content}</p>
                          )}
                        </div>
                        
                        {/* Reactions and Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {/* Reactions */}
                            <div className="flex space-x-1">
                              {['👍', '❤️', '😊', '🎉'].map((emoji) => {
                                const reactionCount = comment.reactions.filter(r => r.emoji === emoji).length;
                                const userReacted = comment.reactions.some(r => r.emoji === emoji && r.userId === user?.id);
                                
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(comment.id, emoji)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                      userReacted 
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    {reactionCount > 0 && <span>{reactionCount}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="flex items-center space-x-1 text-xs text-white/60 hover:text-white/80"
                          >
                            <Reply className="w-3 h-3" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/60">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/90">
                      <span className="font-medium">{activity.userName}</span>{' '}
                      {activity.description}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/60">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Submit Review Button */}
            {canUserComment && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors border border-purple-400/30"
              >
                <Star className="w-4 h-4" />
                <span>Submit Review</span>
              </button>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-medium text-white mb-3">Submit Review</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/80 mb-1">Status</label>
                    <select
                      value={reviewData.status}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="approved" className="bg-slate-800">Approved</option>
                      <option value="changes_requested" className="bg-slate-800">Changes Requested</option>
                      <option value="rejected" className="bg-slate-800">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 mb-1">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                          className={`p-1 ${star <= reviewData.rating ? 'text-yellow-400' : 'text-white/30'}`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/80 mb-1">Feedback</label>
                    <textarea
                      value={reviewData.feedback}
                      onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Provide your feedback..."
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleSubmitReview}
                      className="px-4 py-2 bg-purple-500/80 text-white rounded-lg hover:bg-purple-500"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {review.reviewerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-white text-sm">{review.reviewerName}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              review.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                              review.status === 'changes_requested' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {review.status.replace('_', ' ')}
                            </span>
                            {review.rating && (
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < review.rating! ? 'text-yellow-400 fill-current' : 'text-white/30'}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-white/60">
                        {formatTimeAgo(review.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-white/90 text-sm">{review.feedback}</p>
                    
                    {review.suggestions.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-white/80 mb-2">Suggestions:</h5>
                        <ul className="space-y-1">
                          {review.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-white/70 flex items-start space-x-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/60">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reviews yet</p>
                  <p className="text-sm">Be the first to review this task!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          task={task}
          onClose={() => setShowInviteModal(false)}
          onInvite={() => {
            setShowInviteModal(false);
            loadCollaborationData();
          }}
        />
      )}
    </div>
  );
};

export default TaskCollaboration;
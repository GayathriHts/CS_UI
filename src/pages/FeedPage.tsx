import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/cricketSocialService';
import { useAuthStore } from '../store/slices/authStore';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function FeedPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: feed, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => feedService.getFeed().then((r) => r.data),
  });

  const createPost = useMutation({
    mutationFn: (content: string) => feedService.create({ content }),
    onSuccess: () => { setNewPost(''); queryClient.invalidateQueries({ queryKey: ['feed'] }); },
  });

  const likePost = useMutation({
    mutationFn: (id: string) => feedService.like(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['feedComments', activeCommentsPostId],
    queryFn: () => feedService.getComments(activeCommentsPostId!).then((r) => r.data),
    enabled: !!activeCommentsPostId,
  });

  const addComment = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => feedService.addComment(id, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['feedComments', activeCommentsPostId] });
      setCommentText('');
    },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark shadow-lg">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <img src="/images/cs-logo.png" alt="CricketSocial" className="h-8" />
                <span className="text-white font-bold text-lg">CricketSocial</span>
              </Link>
            </div>
            <h2 className="text-white font-semibold">Social Feed</h2>
            <div className="w-20" />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto pt-20 px-4 pb-8">
        {/* New Post */}
        <div className="card mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.firstName?.[0]}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's happening in your cricket world?"
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
              />
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-3">
                  <button className="text-gray-400 hover:text-brand-green text-sm flex items-center gap-1">📷 Photo</button>
                  <button className="text-gray-400 hover:text-brand-green text-sm flex items-center gap-1">🎥 Video</button>
                </div>
                <button
                  onClick={() => createPost.mutate(newPost)}
                  disabled={!newPost.trim() || createPost.isPending}
                  className="btn-primary text-sm px-6"
                >
                  {createPost.isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading feed...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed?.items.length ? feed.items.map((post) => (
              <div key={post.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-brand-green rounded-full flex items-center justify-center text-white font-bold">
                    {post.userProfileImage ? (
                      <img src={post.userProfileImage} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      post.userName.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{post.userName}</p>
                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
                {post.content && <p className="text-gray-800 mb-3 leading-relaxed">{post.content}</p>}
                {post.mediaUrl && <img src={post.mediaUrl} alt="" className="rounded-xl mb-3 w-full" />}
                <div className="flex gap-6 pt-3 border-t text-sm">
                  <button
                    onClick={() => likePost.mutate(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    ❤️ <span>{post.likesCount}</span>
                  </button>
                  <button
                    onClick={() => {
                      setCommentText('');
                      setActiveCommentsPostId((cur) => (cur === post.id ? null : post.id));
                    }}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-brand-green transition-colors"
                  >
                    💬 <span>{post.commentsCount}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors ml-auto">
                    🔗 Share
                  </button>
                </div>

                {activeCommentsPostId === post.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-3 mb-4">
                      {isCommentsLoading ? (
                        <p className="text-sm text-gray-400">Loading comments...</p>
                      ) : comments?.length ? (
                        comments.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                              {c.userName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-gray-800">{c.userName}</span>{' '}
                                <span className="text-gray-600">{c.content}</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">No comments yet.</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
                      />
                      <button
                        onClick={() => {
                          const content = commentText.trim();
                          if (!content) return;
                          addComment.mutate({ id: post.id, content });
                        }}
                        disabled={!commentText.trim() || addComment.isPending}
                        className="btn-primary text-sm px-4"
                      >
                        {addComment.isPending ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="card text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No posts yet</p>
                <p className="text-gray-400 text-sm">Be the first to share something!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

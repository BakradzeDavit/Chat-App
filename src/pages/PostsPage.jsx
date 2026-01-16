import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { Link } from "react-router-dom";
import DeletePost from "../components/DeletePost";
import LikePost from "../components/LikePost";

function PostsPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Add loading state

  const isMyPost = (post) => {
    return post.author === user.id;
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handleLike = async (postId) => {
    // 1. Optimistic Update
    setPosts((prevPosts) => {
      const post = prevPosts.find((p) => p.id === postId);
      if (!post) return prevPosts;

      const wasLiked = post.likes?.includes(user.id);

      return prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
              likes: wasLiked
                ? p.likes.filter((id) => id !== user.id)
                : [...(p.likes || []), user.id],
            }
          : p
      );
    });

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        // 2. Confirm with Server Data (to ensure consistency)
        const data = await response.json();
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likesCount: data.likesCount,
                  likes: data.likes || [],
                }
              : p
          )
        );
      } else {
        // 3. Revert on Error
        setPosts((prevPosts) => {
          const post = prevPosts.find((p) => p.id === postId);
          if (!post) return prevPosts;

          const isLiked = post.likes?.includes(user.id); // This checks the *optimistic* state

          // If we optimistically liked it, and it failed, we need to *unlike* it (revert)
          // Effectively we just toggle back.
          
          // However, simpler is just to re-fetch or toggle back based on previous knowledge.
          // Since we don't have previous knowledge easily, we can just toggle back.
           return prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
                  likes: isLiked
                    ? p.likes.filter((id) => id !== user.id)
                    : [...(p.likes || []), user.id],
                }
              : p
          );
        });
        console.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
       // Revert logic here as well if needed, similar to above
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    let isMounted = true;

    const fetchPosts = async () => {
      // Don't set loading to true on every background refresh if we already have posts
      if(posts.length === 0) setIsLoading(true);
      
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          console.error("Token invalid or expired");
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data && Array.isArray(data.posts)) {
            setPosts(data.posts);
          }
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, [navigate, user?.id]); // ✅ Fix: Depend only on user.id to prevent infinite loops

  // Socket listener for real-time post likes
  useEffect(() => {
    if (!user || !user.id) return;

    const socketInstance = window.socketRef?.current;
    if (!socketInstance) return;

    // Join user's socket room
    socketInstance.emit("userOnline", user.id);

    // Listen for post liked event
    const handlePostLiked = (data) => {
      const { postId, likerId, likesCount, likes } = data;
      console.log("Post liked via socket:", data);
      
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likesCount: likesCount,
                likes: likes || [],
              }
            : p
        )
      );
    };

    socketInstance.on("postLiked", handlePostLiked);

    return () => {
      socketInstance.off("postLiked", handlePostLiked);
    };
  }, [user]);


  const handleCreate = async () => {
    if (newPost.trim()) {
      try {
        const response = await fetch(`${API_URL}/create-post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ text: newPost }),
        });

        if (response.ok) {
          const newPostData = await response.json();
          setPosts([newPostData.post, ...posts]);
          setNewPost("");
        } else {
          alert("❌ Failed to create post.");
        }
      } catch (error) {
        console.error("Error creating post:", error);
      }
    }
  };

  return (
    <div className="posts-page">
      <div className="posts-container">
        <div className="posts-header">
          <h1>Posts</h1>
          <p>Share what's on your mind</p>
        </div>

        <div className="create-post-card">
          <label>Create a new post</label>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            rows="3"
          />
          <button onClick={handleCreate} className="add-post-btn">
            Add Post
          </button>
        </div>

        <div className="posts-feed">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-content-wrapper">
                <Link
                  to={`/users/${post.author}/profile`}
                  className="post-avatar"
                >
                  {post.profileImage && post.profileImage !== "letter" ? (
                    <img
                      src={post.profileImage}
                      alt="Avatar"
                      className="post-profile-image"
                    />
                  ) : (
                    <span>
                      {post.displayName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </Link>
                <div className="post-text-content">
                  <div className="post-meta">
                    <Link
                      to={`/users/${post.author}/profile`}
                      className="post-username"
                    >
                      {post.displayName || "Unknown User"}
                    </Link>
                    <span className="post-date">
                      ·{" "}
                      {new Date(post.createdAt).toLocaleDateString() ||
                        "Just now"}
                    </span>
                  </div>
                  <p className="post-text">{post.text}</p>

                  <div className="interactions">
                    <LikePost onlike={handleLike} post={post} user={user} />
                    <div 
                      className="Comment" 
                      onClick={() => {
                        // Toggle comment input visibility
                        setPosts(prev => prev.map(p => 
                          p.id === post.id ? { ...p, showCommentInput: !p.showCommentInput } : p
                        ));
                      }}
                    >
                      <i className="bi bi-chat"></i>
                      <span>{post.comments ? post.comments.length : 0}</span>
                    </div>
                    {isMyPost(post) && (
                      <DeletePost post={post} onDelete={handleDeletePost} />
                    )}
                  </div>
                  
                  {/* Comments Section */}
                  {(post.showCommentInput || (post.comments && post.comments.length > 0)) && (
                    <div className="comments-section">
                       {/* Comment Input */}
                       {post.showCommentInput && (
                         <div className="comment-input-wrapper">
                            <input 
                              type="text" 
                              placeholder="Write a comment..." 
                              className="comment-input"
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const text = e.target.value;
                                  e.target.value = ''; // Clear input
                                  
                                  try {
                                    const res = await fetch(`${API_URL}/comments`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                                      },
                                      body: JSON.stringify({ postId: post.id, text }),
                                    });
                                    
                                    if (res.ok) {
                                      const data = await res.json();
                                      setPosts(prev => prev.map(p => 
                                        p.id === post.id ? { 
                                          ...p, 
                                          comments: [data.comment, ...(p.comments || [])],
                                          commentsCount: (p.commentsCount || 0) + 1
                                        } : p
                                      ));
                                    }
                                  } catch (err) {
                                    console.error("Error posting comment", err);
                                  }
                                }
                              }}
                            />
                         </div>
                       )}

                       {/* Recent Comments Preview */}
                       {post.comments && post.comments.length > 0 && (
                         <div className="recent-comments">
                           {post.comments.slice(0, 2).map((comment, idx) => (
                             <div key={comment._id || idx} className="comment-bubble">
                               <span className="comment-author">{comment.author?.displayName}:</span>
                               <span className="comment-text">{comment.text}</span>
                             </div>
                           ))}
                           {post.comments.length > 2 && (
                             <div className="view-more-comments">
                               View all {post.comments.length} comments
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostsPage;

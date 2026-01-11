import React, { useState, useEffect } from "react";

import DeletePost from "../components/DeletePost";
import LikePost from "../components/LikePost";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { Link } from "react-router-dom";
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
    try {
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

      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        // Revert on error
        setPosts((prevPosts) => {
          const post = prevPosts.find((p) => p.id === postId);
          if (!post) return prevPosts;

          const isLiked = post.likes?.includes(user.id);

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
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    let isMounted = true;

    const fetchPosts = async () => {
      setIsLoading(true);
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
  }, [navigate, user]);

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
                    <div className="Comment">
                      <span>Comment </span> <i className="bi bi-chat"></i>
                    </div>
                    {isMyPost(post) && (
                      <DeletePost post={post} onDelete={handleDeletePost} />
                    )}
                  </div>
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

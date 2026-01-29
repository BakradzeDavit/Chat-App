import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { Link } from "react-router-dom";
import DeletePost from "../components/DeletePost";
import LikePost from "../components/LikePost";
import postsfunctions from "../functions/posts";
import "./PostsPage.css";

function PostsPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("text"); // 'text' or 'media'
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPostId, setDropdownPostId] = useState(null);
  const navigate = useNavigate();

  // ✅ Add loading state

  const handleLike = async (postId) => {
    await postsfunctions.handleLike(postId, user, posts, setPosts);
  };

  const handleDeletePost = (postId) => {
    postsfunctions.handleDeletePost(postId, posts, setPosts);
  };

  const isMyPost = (post) => {
    return postsfunctions.isMyPost(post, user);
  };

  const handleImageSelect = (e) => {
    postsfunctions.handleImageSelect(e, setSelectedImage, setPreviewUrl);
  };

  const clearImage = () => {
    postsfunctions.clearImage(setSelectedImage, setPreviewUrl, fileInputRef);
  };

  const handleCreate = async () => {
    await postsfunctions.handleCreate(
      newPost,
      selectedImage,
      posts,
      setPosts,
      setNewPost,
      clearImage,
      setActiveTab,
    );
  };

  const fetchPosts = async () => {
    await postsfunctions.fetchPosts(
      user,
      posts,
      setPosts,
      setIsLoading,
      navigate,
    );
  };

  const handlePostLiked = (data) => {
    postsfunctions.handlePostLiked(data, setPosts);
  };

  const ShareFunction = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Post URL copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    let isMounted = true;

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
    socketInstance.on("postLiked", handlePostLiked);

    return () => {
      socketInstance.off("postLiked", handlePostLiked);
    };
  }, [user]);

  return (
    <div className="posts-page">
      <div className="posts-container">
        <div className="posts-header"></div>

        <div className="create-post-card">
          <label>Create a new post</label>
          {previewUrl && (
            <div className="image-preview-container">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              <button onClick={clearImage} className="remove-image-btn">
                <i className="bi bi-x-circle-fill"></i>
              </button>
            </div>
          )}
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening?"
            rows="3"
          />
          <div className="create-post-actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              style={{ display: "none" }}
            />
            <div className="add-options-wrapper">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="add-image-btn"
                title="Add"
              >
                <i className="bi bi-plus"></i>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu left">
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setDropdownOpen(false);
                    }}
                  >
                    <i className="bi bi-image"></i> Add Image
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleCreate} className="add-post-btn">
              Add Post
            </button>
          </div>
        </div>

        <div className="feed-tabs">
          <button
            className={`tab-btn ${activeTab === "text" ? "active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            Messages
          </button>
          <button
            className={`tab-btn ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            Media
          </button>
        </div>

        <div className="posts-feed">
          {posts
            .filter((post) => (activeTab === "text" ? !post.image : post.image))
            .map((post) => {
              const hasImage = !!post.image;

              if (hasImage) {
                // INSTAGRAM STYLE FOR MEDIA
                return (
                  <div key={post.id} className="media-post-card">
                    <div className="media-post-header">
                      <Link
                        to={`/users/${post.author}/profile`}
                        className="media-user-info"
                      >
                        <div className="media-avatar">
                          {post.profileImage &&
                          (post.profileImage.startsWith("http") ||
                            post.profileImage.startsWith("data:")) ? (
                            <img src={post.profileImage} alt="Avatar" />
                          ) : (
                            <span>
                              {post.displayName?.charAt(0).toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div className="media-user-details">
                          <span className="media-username">
                            {post.displayName || "Unknown User"}
                          </span>
                          <span className="media-timestamp">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                      <div
                        className="media-more-btn"
                        style={{ position: "relative" }}
                        onClick={() =>
                          setDropdownPostId(
                            dropdownPostId === post.id ? null : post.id,
                          )
                        }
                      >
                        <i className="bi bi-three-dots"></i>
                        {dropdownPostId === post.id && (
                          <div className="dropdown-menu right">
                            <div
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/posts/${post.id}`);
                                setDropdownPostId(null);
                              }}
                            >
                              <i className="bi bi-eye"></i> View Post
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="media-content">
                      <img
                        src={post.image}
                        alt="Post content"
                        className="media-image"
                      />
                    </div>

                    <div className="media-footer">
                      <div className="media-actions">
                        <div className="media-left-actions">
                          <div
                            className="media-action-btn"
                            onClick={() => handleLike(post.id)}
                          >
                            <i
                              className={`bi bi-heart${post.likes?.includes(user.id) ? "-fill liked" : ""}`}
                            ></i>
                          </div>
                          <div
                            className="media-action-btn"
                            onClick={() => {
                              setPosts((prev) =>
                                prev.map((p) =>
                                  p.id === post.id
                                    ? {
                                        ...p,
                                        showCommentInput: !p.showCommentInput,
                                      }
                                    : p,
                                ),
                              );
                            }}
                          >
                            <i className="bi bi-chat"></i>
                          </div>
                          <div className="media-action-btn">
                            <i
                              className="bi bi-send"
                              onClick={() => ShareFunction(post.id)}
                            ></i>
                          </div>
                        </div>
                        <div className="media-right-actions">
                          {isMyPost(post) && (
                            <DeletePost
                              post={post}
                              onDelete={handleDeletePost}
                            />
                          )}
                        </div>
                      </div>

                      <div className="media-likes-count">
                        {post.likesCount || 0} likes
                      </div>

                      <div className="media-caption">
                        <span className="media-caption-user">
                          {post.displayName}
                        </span>{" "}
                        {post.text}
                      </div>

                      {/* Comments Section */}
                      {(post.showCommentInput ||
                        (post.comments && post.comments.length > 0)) && (
                        <div className="media-comments-section">
                          {post.comments && post.comments.length > 0 && (
                            <div className="media-recent-comments">
                              {post.comments.slice(0, 2).map((comment, idx) => (
                                <div
                                  key={comment._id || idx}
                                  className="media-comment-item"
                                >
                                  <span className="media-comment-user">
                                    {comment.author?.displayName}:
                                  </span>
                                  <span className="media-comment-text">
                                    {comment.text}
                                  </span>
                                </div>
                              ))}
                              {post.comments.length > 2 && (
                                <div
                                  className="media-view-all"
                                  onClick={() => {
                                    /* Handle view all */
                                  }}
                                >
                                  View all {post.comments.length} comments
                                </div>
                              )}
                            </div>
                          )}

                          {post.showCommentInput && (
                            <div className="media-comment-input-wrapper">
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                onKeyDown={async (e) => {
                                  if (
                                    e.key === "Enter" &&
                                    e.target.value.trim()
                                  ) {
                                    const text = e.target.value;
                                    e.target.value = "";
                                    postsfunctions.handleAddCommentMultiple(
                                      post.id,
                                      text,
                                      posts,
                                      setPosts,
                                    );
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // TWITTER STYLE FOR TEXT
              return (
                <div key={post.id} className="post-card">
                  <div className="post-content-wrapper">
                    <Link
                      to={`/users/${post.author}/profile`}
                      className="post-avatar"
                    >
                      {post.profileImage &&
                      (post.profileImage.startsWith("http") ||
                        post.profileImage.startsWith("data:")) ? (
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
                        <div
                          className="post-more-btn"
                          onClick={() =>
                            setDropdownPostId(
                              dropdownPostId === post.id ? null : post.id,
                            )
                          }
                        >
                          <i className="bi bi-three-dots"></i>
                          {dropdownPostId === post.id && (
                            <div className="dropdown-menu right">
                              <div
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/posts/${post.id}`);
                                  setDropdownPostId(null);
                                }}
                              >
                                <i className="bi bi-eye"></i> View Post
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="post-text">{post.text}</p>
                      <div className="interactions">
                        <LikePost onlike={handleLike} post={post} user={user} />
                        <div
                          className="Comment"
                          onClick={() => {
                            setPosts((prev) =>
                              prev.map((p) =>
                                p.id === post.id
                                  ? {
                                      ...p,
                                      showCommentInput: !p.showCommentInput,
                                    }
                                  : p,
                              ),
                            );
                          }}
                        >
                          <i className="bi bi-chat"></i>
                          <span>
                            {post.comments ? post.comments.length : 0}
                          </span>
                        </div>
                        <div
                          className="Share"
                          onClick={() => ShareFunction(post.id)}
                        >
                          <i className="bi bi-send"></i>
                        </div>
                        {isMyPost(post) && (
                          <DeletePost post={post} onDelete={handleDeletePost} />
                        )}
                      </div>

                      {/* Comments Section */}
                      {(post.showCommentInput ||
                        (post.comments && post.comments.length > 0)) && (
                        <div className="comments-section">
                          {post.showCommentInput && (
                            <div className="comment-input-wrapper">
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                className="comment-input"
                                onKeyDown={async (e) => {
                                  if (
                                    e.key === "Enter" &&
                                    e.target.value.trim()
                                  ) {
                                    const text = e.target.value;
                                    e.target.value = "";
                                    postsfunctions.handleAddCommentMultiple(
                                      post.id,
                                      text,
                                      posts,
                                      setPosts,
                                    );
                                  }
                                }}
                              />
                            </div>
                          )}

                          {post.comments && post.comments.length > 0 && (
                            <div className="recent-comments">
                              {post.comments.slice(0, 2).map((comment, idx) => (
                                <div
                                  key={comment._id || idx}
                                  className="comment-item"
                                >
                                  <Link
                                    to={`/users/${comment.author?._id}/profile`}
                                    className="comment-avatar-link"
                                  >
                                    {comment.author?.profileImage &&
                                    (comment.author?.profileImage.startsWith(
                                      "http",
                                    ) ||
                                      comment.author?.profileImage.startsWith(
                                        "data:",
                                      )) ? (
                                      <img
                                        src={comment.author.profileImage}
                                        alt="Avatar"
                                        className="comment-avatar"
                                      />
                                    ) : (
                                      <div className="comment-avatar-placeholder">
                                        {comment.author?.displayName
                                          ?.charAt(0)
                                          .toUpperCase() || "U"}
                                      </div>
                                    )}
                                  </Link>
                                  <div className="comment-bubble">
                                    <span className="comment-author">
                                      {comment.author?.displayName}:
                                    </span>
                                    <span className="comment-text">
                                      {comment.text}
                                    </span>
                                  </div>
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
              );
            })}
        </div>

        {posts.filter((post) =>
          activeTab === "text" ? !post.image : post.image,
        ).length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === "text" ? "📝" : "🖼️"}
            </div>
            <p>
              {activeTab === "text"
                ? "No message posts yet."
                : "No media posts yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostsPage;

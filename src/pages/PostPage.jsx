import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { Link } from "react-router-dom";
import DeletePost from "../components/DeletePost";
import LikePost from "../components/LikePost";
import postsfunctions from "../functions/posts";
import "./PostPage.css";

function PostPage({ user, setAlertMessage }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
        } else if (response.status === 404) {
          alert("Post not found");
          navigate("/posts");
        } else {
          console.error("Failed to fetch post");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, user, navigate]);

  const handleLike = async (postId) => {
    await postsfunctions.handleLikeSingle(postId, user, setPost);
  };

  const handleDeletePost = (postId) => {
    postsfunctions.handleDeletePost(postId, posts, setPosts, setAlertMessage);
  };

  const ShareFunction = (postId) => {
    postsfunctions.ShareFunction(postId, setAlertMessage);
  };

  if (isLoading) {
    return <div className="post-page">Loading...</div>;
  }

  if (!post) {
    return <div className="post-page">Post not found</div>;
  }
  const isMyPost = post.author === user.id;
  const hasImage = !!post.image;

  return (
    <div className="post-page">
      <div className="post-container">
        <div className="post-header">
          <h1>Post</h1>
        </div>
        {hasImage ? (
          // INSTAGRAM STYLE FOR MEDIA
          <div className="media-post-card">
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
              <div className="media-more-btn">
                <i className="bi bi-three-dots"></i>
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
                      setPost((prev) => ({
                        ...prev,
                        showCommentInput: !prev.showCommentInput,
                      }));
                    }}
                  >
                    <i className="bi bi-chat"></i>
                  </div>
                  <div className="media-action-btn">
                    <i className="bi bi-send"></i>
                  </div>
                </div>
                <div className="media-right-actions">
                  {isMyPost && (
                    <DeletePost post={post} onDelete={handleDeletePost} />
                  )}
                </div>
              </div>

              <div className="media-likes-count">
                {post.likesCount || 0} likes
              </div>

              <div className="media-caption">
                <span className="media-caption-user">{post.displayName}</span>{" "}
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
                          if (e.key === "Enter" && e.target.value.trim()) {
                            const text = e.target.value;
                            e.target.value = "";
                            postsfunctions.handleAddComment(
                              post.id,
                              text,
                              setPost,
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
        ) : (
          // TWITTER STYLE FOR TEXT
          <div className="post-card">
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
                  {isMyPost && (
                    <DeletePost post={post} onDelete={handleDeletePost} />
                  )}
                </div>

                <p className="post-text">{post.text}</p>

                <div className="interactions">
                  <LikePost onlike={handleLike} post={post} user={user} />
                  <div
                    className="Comment"
                    onClick={() => {
                      setPost((prev) => ({
                        ...prev,
                        showCommentInput: !prev.showCommentInput,
                      }));
                    }}
                  >
                    <i className="bi bi-chat"></i>

                    <span>{post.comments ? post.comments.length : 0}</span>
                  </div>

                  <div className="Share" onClick={() => ShareFunction(post.id)}>
                    <i className="bi bi-send"></i>
                  </div>
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
                            if (e.key === "Enter" && e.target.value.trim()) {
                              const text = e.target.value;
                              e.target.value = "";
                              postsfunctions.handleAddComment(
                                post.id,
                                text,
                                setPost,
                              );
                            }
                          }}
                        />
                      </div>
                    )}

                    {post.comments && post.comments.length > 0 && (
                      <div className="recent-comments">
                        {post.comments.map((comment, idx) => (
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostPage;

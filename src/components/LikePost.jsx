import React from "react";

function LikePost({ onlike, post, user }) {
  // ✅ Safety check
  if (!user || !post) return null;

  const isLiked = post.likes?.includes(user.id);

  return (
    <div className="Like" onClick={() => onlike(post.id)}>
      <i className={`bi bi-hand-thumbs-up${isLiked ? "-fill" : ""}`}></i>{" "}
      <span>{post.likesCount || 0}</span>
    </div>
  );
}

export default LikePost;

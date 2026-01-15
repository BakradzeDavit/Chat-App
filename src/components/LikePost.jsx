import React, { useState } from "react";

function LikePost({ onlike, post, user }) {
  // ✅ Safety check
  if (!user || !post) return null;

  const [isLoading, setIsLoading] = useState(false);
  const isLiked = post.likes?.includes(user.id);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onlike(post.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="Like"
      onClick={handleClick}
      style={{ pointerEvents: isLoading ? "none" : "auto" }}
    >
      <i className={`bi bi-hand-thumbs-up${isLiked ? "-fill" : ""}`}></i>{" "}
      <span>{post.likesCount || 0}</span>
    </div>
  );
}

export default LikePost;

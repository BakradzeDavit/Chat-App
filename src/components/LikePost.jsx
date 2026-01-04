import React from "react";

function LikePost({ onlike, post, user }) {
  const isLiked = post.likes?.some(
    (id) => id.toString() === user.id.toString()
  );
  return (
    <div className="Like" onClick={() => onlike(post.id)}>
      <i className={`bi bi-hand-thumbs-up${isLiked ? "-fill" : ""}`}></i>{" "}
      <span>{post.likesCount || 0}</span>
    </div>
  );
}

export default LikePost;

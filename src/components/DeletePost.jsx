import React, { useState } from "react";
import { API_URL } from "../config";
function DeletePost({ post, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setConfirmDelete(false);

    try {
      const response = await fetch(`${API_URL}/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        console.log("Post deleted successfully");

        if (onDelete) {
          onDelete(post.id);
        }
      } else {
        alert("❌ Failed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("❌ Error deleting post.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="PostDelete"
      disabled={isDeleting}
      style={{
        backgroundColor: confirmDelete
          ? "rgba(239, 68, 68, 0.15)"
          : "transparent",
      }}
    >
      <i className="bi bi-trash"></i>
      {isDeleting ? "Deleting..." : confirmDelete ? "Confirm?" : "Delete"}
    </button>
  );
}

export default DeletePost;

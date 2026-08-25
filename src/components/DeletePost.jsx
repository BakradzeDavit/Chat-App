import React, { useState } from "react";
import { API_URL } from "../config";

function DeletePost({ post, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation(); // Add this to prevent event bubbling

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
        },
        credentials: "include",
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
    <div
      onClick={handleClick}
      disabled={isDeleting}
      className="dropdown-item delete-post"
    >
      <i className="bi bi-trash"></i>
      {isDeleting ? "Deleting..." : confirmDelete ? "Confirm?" : "Delete"}
    </div>
  );
}

export default DeletePost;

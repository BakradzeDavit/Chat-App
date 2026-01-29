import { API_URL } from "../config";

const postsfunctions = {
  isMyPost: (post, user) => {
    return post.author === user.id;
  },

  handleDeletePost: (postId, posts, setPosts) => {
    setPosts(posts.filter((post) => post.id !== postId));
  },

  handleLike: async (postId, user, posts, setPosts) => {
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
          : p,
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
              : p,
          ),
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
              : p,
          );
        });
        console.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert logic here as well if needed, similar to above
    }
  },

  fetchPosts: async (user, posts, setPosts, setIsLoading, navigate) => {
    // Don't set loading to true on every background refresh if we already have posts
    if (posts.length === 0) setIsLoading(true);

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
        if (data && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  },

  handlePostLiked: (data, setPosts) => {
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
          : p,
      ),
    );
  },

  handleImageSelect: (e, setSelectedImage, setPreviewUrl) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  },

  clearImage: (setSelectedImage, setPreviewUrl, fileInputRef) => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  },

  handleCreate: async (
    newPost,
    selectedImage,
    posts,
    setPosts,
    setNewPost,
    clearImage,
    setActiveTab,
  ) => {
    if (newPost.trim() || selectedImage) {
      try {
        const formData = new FormData();
        formData.append("text", newPost);
        if (selectedImage) {
          formData.append("image", selectedImage);
        }

        const response = await fetch(`${API_URL}/create-post`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // Content-Type is irrelevant when sending FormData, browser sets it automatically with boundary
          },
          body: formData,
        });

        if (response.ok) {
          const newPostData = await response.json();
          setPosts([newPostData.post, ...posts]);
          setNewPost("");
          clearImage();

          if (newPostData.post.image) {
            setActiveTab("media");
          } else {
            setActiveTab("text");
          }
        } else {
          alert("❌ Failed to create post.");
        }
      } catch (error) {
        console.error("Error creating post:", error);
      }
    }
  },
  handleLikeSingle: async (postId, user, setPost) => {
    // Optimistic update
    setPost((prevPost) => {
      if (!prevPost) return prevPost;
      const wasLiked = prevPost.likes?.includes(user.id);
      return {
        ...prevPost,
        likesCount: wasLiked
          ? prevPost.likesCount - 1
          : prevPost.likesCount + 1,
        likes: wasLiked
          ? prevPost.likes.filter((id) => id !== user.id)
          : [...(prevPost.likes || []), user.id],
      };
    });

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPost((prevPost) => ({
          ...prevPost,
          likesCount: data.likesCount,
          likes: data.likes || [],
        }));
      } else {
        // Revert
        setPost((prevPost) => {
          if (!prevPost) return prevPost;
          const isLiked = prevPost.likes?.includes(user.id);
          return {
            ...prevPost,
            likesCount: isLiked
              ? prevPost.likesCount - 1
              : prevPost.likesCount + 1,
            likes: isLiked
              ? prevPost.likes.filter((id) => id !== user.id)
              : [...(prevPost.likes || []), user.id],
          };
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  },

  handleAddComment: async (postId, text, setPost) => {
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          postId: postId,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prevPost) => ({
          ...prevPost,
          comments: [data.comment, ...(prevPost.comments || [])],
          commentsCount: (prevPost.commentsCount || 0) + 1,
        }));
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  },

  handleAddCommentMultiple: async (postId, text, posts, setPosts) => {
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          postId: postId,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [data.comment, ...(p.comments || [])],
                  commentsCount: (p.commentsCount || 0) + 1,
                }
              : p,
          ),
        );
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  },
};

export default postsfunctions;

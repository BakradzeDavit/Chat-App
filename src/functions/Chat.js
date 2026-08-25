import { API_URL } from "../config";

const createOrGetChat = async (receiverId) => {
  try {
    const response = await fetch(`${API_URL}/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ receiverId }),
    });

    if (response.ok) {
      const chat = await response.json();
      return { success: true, chat };
    } else {
      console.error("Failed to create/get chat");
      return { success: false };
    }
  } catch (error) {
    console.error("Error creating/getting chat:", error);
    return { success: false };
  }
};

export { createOrGetChat };
export default { createOrGetChat };

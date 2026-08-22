import { useState } from "react";
import ReactBar from "./ReactBar";
import "./Message.css";

function Message({ message, currentUserId, onReact }) {
  const [showReactBar, setShowReactBar] = useState(false);

  const senderId =
    typeof message.sender === "object" ? message.sender?._id : message.sender;

  const isSent = String(senderId) === String(currentUserId);

  const timestamp = message.createdAt || message.timestamp;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const groupedReactions = {};

  for (const reaction of message.reactions || []) {
    const emoji = reaction.emoji;

    if (!groupedReactions[emoji]) {
      groupedReactions[emoji] = 0;
    }

    groupedReactions[emoji]++;
  }

  const handleReact = (emoji) => {
    onReact?.(message, emoji);
    setShowReactBar(false);
  };

  return (
    <div className={`message-wrapper ${isSent ? "sent" : ""}`}>
      <div className="message-content">
        <div
          onMouseEnter={() => setShowReactBar(true)}
          onMouseLeave={() => setShowReactBar(false)}
          className="message-bubble"
        >
          {showReactBar && <ReactBar onReact={handleReact} />}

          {message.content || message.text}
        </div>

        {Object.keys(groupedReactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                className="reaction"
                onClick={() => handleReact(emoji)}
                aria-label={`${emoji} reaction, ${count}`}
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="reaction-count">{count}</span>
              </button>
            ))}
          </div>
        )}
        {formattedTime && <span className="message-time">{formattedTime}</span>}
      </div>
    </div>
  );
}

export default Message;

const emojis = ["😂", "❤️", "🔥", "👍", "😮"];

function ReactBar({ onReact }) {
  return (
    <div className="reaction-bar">
      {emojis.map((emoji) => (
        <button
          onClick={() => onReact?.(emoji)}
          key={emoji}
          type="button"
          className="reaction-button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default ReactBar;

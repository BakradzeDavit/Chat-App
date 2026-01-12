import React from "react";
import { useState } from "react";
function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <i
        onClick={() => setIsOpen(!isOpen)}
        className={
          "Notifications " + (isOpen ? "bi bi-bell" : "bi bi-bell-fill")
        }
      >
        <div className={`notifications-dropdown ${isOpen ? "open" : "closed"}`}>
          <p>No new notifications</p>
        </div>
      </i>
    </div>
  );
}

export default Notifications;

import React from "react";

function UserPage({ user }) {
  return (
    <div>
      <div className="user-info">
        <img src={user.profileImage} alt="Profile" />
        <h2>{user.displayName}</h2>
        <p>{user.email}</p>
      </div>
    </div>
  );
}

export default UserPage;

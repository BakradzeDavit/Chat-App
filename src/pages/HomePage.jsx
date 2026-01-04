import React from 'react'

function HomePage() {
const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div>
      <h1>Welcome, {user?.displayName || "Guest"}!</h1>
      <p>This is the home page of the application.</p>
    </div>
    
  )
}

export default HomePage
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function SignUp({ setLoggedIn, setUser }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordStates, setPasswordStates] = useState([false, false]);

  const handleToggle = (index) => {
    const newStates = [...passwordStates];
    newStates[index] = !newStates[index];
    setPasswordStates(newStates);
  };

  const navigate = useNavigate();

  const signUp = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          displayName,
          password,
        }),
      });

      const data = await response.json();
      console.log("SignUp response:", data);

      // ✅ Ensure user.id is stored as a string
      const userData = {
        ...data.user,
        id: String(data.user.id), // Convert to string
      };

      console.log("User data being stored:", userData); // Debug log

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      // ✅ Set logged in state to true
      setLoggedIn(true);
      setUser(userData);

      // Navigate to home
      navigate("/home");
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  };

  return (
    <div className="RegistrationPage">
      <div className="signup" id="signup">
        <h2>Sign Up</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <input
            className="input"
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="input-group password-group">
          <input
            className="input"
            type={passwordStates[0] ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <i
            className={`bi ${passwordStates[0] ? "bi-eye" : "bi-eye-slash"} eye`}
            onClick={() => handleToggle(0)}
          ></i>
        </div>

        <div className="input-group password-group">
          <input
            className="input"
            type={passwordStates[1] ? "text" : "password"}
            placeholder="Repeat Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <i
            className={`bi ${passwordStates[1] ? "bi-eye" : "bi-eye-slash"} eye`}
            onClick={() => handleToggle(1)}
          ></i>
        </div>

        <button onClick={signUp} className="signupBtn" id="signupBtn">
          Sign Up
        </button>

        <h4 className="toggle-text">
          Already have an account?{" "}
          <button className="toggleReg" onClick={() => navigate("/login")}>
            Login here
          </button>
        </h4>
      </div>
    </div>
  );
}

export default SignUp;

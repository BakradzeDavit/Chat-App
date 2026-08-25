import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./Login.css";

function Login({ setLoggedIn, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStates, setPasswordStates] = useState([false]);

  const handleToggle = (index) => {
    const newStates = [...passwordStates];
    newStates[index] = !newStates[index];
    setPasswordStates(newStates);
  };

  const navigate = useNavigate();

  const login = () => {
    try {
      fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Login failed");
          }

          return data;
        })
        .then((data) => {
          const userData = {
            ...data.user,
            id: String(data.user.id),
          };

          localStorage.setItem("user", JSON.stringify(userData));

          setUser(userData);
          setLoggedIn(true);

          navigate("/home");
        })
        .catch((error) => {
          console.error("Login failed:", error);
        });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="RegistrationPage">
      <div className="login" id="login">
        <h2>Login</h2>

        <div className="input-group">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          >
            {" "}
          </i>
        </div>

        <button onClick={login} className="loginBtn" id="loginBtn">
          Login
        </button>

        <h4 className="toggle-text">
          Don't have an account?{" "}
          <button className="toggleReg" onClick={() => navigate("/signup")}>
            Sign up here
          </button>
        </h4>
      </div>
    </div>
  );
}

export default Login;

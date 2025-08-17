// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import API from "../api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    try {
      const res = await API.post("/auth/login", { email, password });
      if (!res.data || !res.data.token || !res.data.user) {
        toast.error("Login failed: invalid server response");
        return;
      }

      // Save token and user in context
      login(res.data.token, res.data.user);

      toast.success("Login successful!");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-hero">
      <Toaster position="top-right" />
      <div className="bg-glass p-10 rounded-3xl shadow-bubble w-full max-w-md">
        <h2 className="text-3xl font-bold text-gradient-primary mb-6 text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-primary text-white py-3 rounded hover:opacity-90 transition-theme"
        >
          Login
        </button>

        <p className="mt-4 text-center text-muted-foreground">
          Don't have an account?{" "}
          <span
            className="text-primary cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;

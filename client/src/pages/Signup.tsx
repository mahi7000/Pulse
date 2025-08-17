// src/pages/Signup.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../api";
import { useAuth } from "../context/AuthContext";

const OTP_LENGTH = 6;

const Signup: React.FC = () => {
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [emailExists, setEmailExists] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("All fields are required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Invalid email address");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;

    try {
      const res = await API.post("/auth/check-user", { email });
      if (res.data.exists) {
        setEmailExists(true);
        toast.error("User already signed up. Please login.");
        return;
      }
      setEmailExists(false);

      await API.post("/auth/send-otp", { email });
      setStep(2);
      toast.success("OTP sent! Check your email.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== OTP_LENGTH) {
      toast.error("Please enter the full OTP");
      return;
    }

    try {
      const res = await API.post("/auth/verify-otp", {
        email,
        otp: otpCode,
        name,
        password,
      });

      // Use AuthContext login to store token and user
      await login(res.data.token, res.data.user);

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "OTP verification failed");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-hero">
      <Toaster position="top-right" />
      <div className="bg-glass p-10 rounded-3xl shadow-bubble w-full max-w-md">
        <h2 className="text-3xl font-bold text-gradient-primary mb-6 text-center">Signup</h2>

        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Name"
              className="w-full p-3 mb-4 rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 mb-1 rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailExists && (
              <p className="text-destructive text-sm mb-4">
                User already signed up. Please{" "}
                <span className="underline cursor-pointer" onClick={() => navigate("/login")}>
                  login
                </span>.
              </p>
            )}
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-4 rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 mb-4 rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              onClick={handleSendOtp}
              className="w-full bg-gradient-primary text-white py-3 rounded hover:opacity-90 transition-theme"
            >
              Send OTP
            </button>

            <p className="mt-4 text-center text-muted-foreground">
              Already have an account?{" "}
              <span
                className="text-primary cursor-pointer hover:underline"
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-center mb-4 text-muted-foreground">
              Enter the 6-digit OTP sent to your email
            </p>
            <div className="flex justify-between mb-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl rounded border border-input bg-transparent text-foreground focus:ring-2 focus:ring-primary transition-theme"
                  value={digit}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-gradient-success text-white py-3 rounded hover:opacity-90 transition-theme"
            >
              Verify OTP & Signup
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/forgot-password/send-otp", { email });
      setMessage("OTP sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/login-with-otp", { email, otp });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "OTP login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/reset-password-with-otp", {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      setMessage("Password reset successful. You can login now.");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3b1d7a] to-[#6f8df5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Forgot Password</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Get OTP on email, then login with OTP or set a new password.
        </p>

        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        {message && <p className="text-green-600 text-center mb-3">{message}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full border px-4 py-3 rounded-lg mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleSendOtp}
          disabled={loading || !email}
          className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50 mb-4"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>

        <input
          type="text"
          maxLength="6"
          placeholder="Enter OTP"
          className="w-full border px-4 py-3 rounded-lg mb-3"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleLoginWithOtp}
          disabled={loading || !email || !otp}
          className="w-full bg-indigo-700 text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50 mb-5"
        >
          Login with OTP
        </button>

        <input
          type="password"
          placeholder="New Password"
          className="w-full border px-4 py-3 rounded-lg mb-3"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full border px-4 py-3 rounded-lg mb-3"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          onClick={handleResetPassword}
          disabled={loading || !email || !otp || !newPassword || !confirmPassword}
          className="w-full bg-green-700 text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          Reset Password
        </button>

        <p className="text-center mt-5">
          <Link to="/login" className="text-blue-600">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

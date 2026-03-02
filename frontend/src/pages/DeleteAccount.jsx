import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function DeleteAccount() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.post("/delete-account/send-otp");
      setMessage("OTP sent to your registered email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Warning: This action is permanent. All your documents, passwords, reminders, family and emergency contacts, and account data will be deleted. Continue?"
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.post("/delete-account/confirm", { otp });
      alert("Account deleted successfully. All your details have been removed.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f7] flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold text-red-700 text-center mb-3">Delete Account</h2>
        <p className="text-sm text-gray-700 mb-6 text-center">
          Confirm deletion by OTP sent to your email. This action cannot be undone.
        </p>

        {error && <p className="text-red-600 text-center mb-3">{error}</p>}
        {message && <p className="text-green-700 text-center mb-3">{message}</p>}

        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>

        <input
          type="text"
          maxLength="6"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 mt-4"
        />

        <button
          onClick={handleDeleteAccount}
          disabled={loading || otp.trim().length < 6}
          className="w-full mt-4 bg-red-700 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Processing..." : "Delete My Account"}
        </button>

        <p className="text-center mt-5">
          <Link to="/dashboard" className="text-blue-600">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default DeleteAccount;

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

function Verify() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "your email";

  const handleVerify = async () => {
    try {
      await api.post("/verify-otp", { email, otp });
      alert("Verification Successful! Please Login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#3b2486] to-[#6f8df5]">

      {/* Header */}
      <div className="bg-white px-10 py-6">
        <h1 className="text-3xl font-bold text-indigo-700">SAFEDOCS</h1>
      </div>

      {/* Verify Card */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white rounded-3xl p-10 w-full max-w-sm text-center relative">

          {/* Back Arrow */}
          <Link
            to="/register"
            className="absolute left-5 top-5 text-indigo-700 text-2xl"
          >
            ←
          </Link>

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
              ✉️
            </div>
          </div>

          <h2 className="text-3xl font-bold text-indigo-700 mb-2">
            Verify your Email
          </h2>

          <p className="text-gray-600 mb-6">
            Please enter the 6-digit code we sent to <br />
            <span className="text-indigo-600 underline">
              {email}
            </span>
          </p>

          {error && <p className="text-red-500 mb-2">{error}</p>}

          <input
            type="text"
            maxLength="6"
            className="w-full text-center text-3xl tracking-widest border-2 border-indigo-500 rounded-xl px-4 py-3 mb-6 focus:outline-none"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
          />

          <button
            onClick={handleVerify}
            className="w-full bg-gradient-to-b from-[#3b2486] to-[#6f8df5] text-black py-3 rounded-xl text-lg shadow-lg mb-4 hover:opacity-90"
          >
            verify account
          </button>

          <p className="text-sm text-gray-600">
            Didn’t receive the code?{" "}
            <span className="text-indigo-600 underline cursor-pointer">
              Resend Code
            </span>{" "}
            | 00:59
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-white py-4 bg-gradient-to-t from-[#2b0f5c] to-transparent">
        © 2025 SAFE DOCS. All rights reserved.
      </div>
    </div>
  );
}

export default Verify;

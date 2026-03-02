import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      await api.post("/register", { name, email, password, confirmPassword });
      navigate("/verify", { state: { email } });
    } catch (err) {
      console.error("Registration Error:", err);
      const msg = err.response?.data?.message || err.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#3b2486] to-[#6f8df5]">

      {/* Header */}
      <div className="bg-white px-10 py-6">
        <h1 className="text-3xl font-bold text-indigo-700">SAFEDOCS</h1>
      </div>

      {/* Register Card */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md border-4 border-black rounded-3xl p-10 text-white">
          <h2 className="text-3xl font-light mb-8 text-center">
            Create an account
          </h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <label className="text-lg text-gray-300">Name</label>
          <input
            type="text"
            className="w-full mt-2 mb-6 px-4 py-3 rounded-full bg-transparent border-2 border-black focus:outline-none text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="text-lg text-gray-300">Email id</label>
          <input
            type="email"
            className="w-full mt-2 px-4 py-3 rounded-full bg-transparent border-2 border-black focus:outline-none text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <p className="text-sm text-cyan-300 mt-2 mb-6">
            ! we will send an OTP to verify this email
          </p>

          <label className="text-lg text-gray-300">Password</label>
          <input
            type="password"
            className="w-full mt-2 mb-6 px-4 py-3 rounded-full bg-transparent border-2 border-black focus:outline-none text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="text-lg text-gray-300">confirm password</label>
          <input
            type="password"
            className="w-full mt-2 mb-8 px-4 py-3 rounded-full bg-transparent border-2 border-black focus:outline-none text-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* Create Account -> Verify */}
          <div className="flex justify-center">
            <button
              onClick={handleRegister}
              disabled={loading}
              className="bg-black text-white px-10 py-3 rounded-xl text-lg hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "create account"}
            </button>
          </div>

          <p className="text-center mt-8 text-black text-lg">
            already have an account?{" "}
            <Link to="/login" className="text-white underline">
              login in
            </Link>
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

export default Register;

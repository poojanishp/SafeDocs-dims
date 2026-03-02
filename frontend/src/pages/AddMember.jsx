import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function AddMember() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Invalid email address");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/family/send-otp", formData);
      setStep(2);
      setMessage("OTP sent to the entered email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndAdd = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/family/add", { email: formData.email, otp });
      alert("Member Added Successfully");
      navigate("/familyvault");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f7]">
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 text-white">
        <h1 className="text-2xl font-bold">SAFE DOCS</h1>
      </div>

      <div className="mx-auto mt-10 bg-white w-[600px] rounded-xl p-8 shadow">
        <h2 className="text-xl font-bold mb-6">Add New Family Member</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}
        {message && <p className="text-green-700 mb-3">{message}</p>}

        {step === 1 ? (
          <>
            <label className="block mb-2">Name</label>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 mb-4"
            />

            <label className="block mb-2">Relation</label>
            <input
              type="text"
              placeholder="Brother, Mother, etc."
              value={formData.relation}
              onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 mb-4"
            />

            <label className="block mb-2">Email</label>
            <input
              type="email"
              placeholder="member@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 mb-6"
            />

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg mb-6 disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <label className="block mb-2">Enter OTP</label>
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-4"
            />

            <button
              onClick={handleVerifyAndAdd}
              disabled={loading || otp.trim().length < 6}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Add"}
            </button>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full mt-3 border border-blue-600 text-blue-600 px-6 py-2 rounded-lg disabled:opacity-50"
            >
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AddMember;

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function FamilyVault() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get("/family/all");
        setMembers(res.data);
      } catch (err) {
        console.error("Failed to fetch members", err);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen bg-[#eef1f7]">
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFE DOCS</h1>
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mydocuments">My Documents</Link>
        </div>
      </div>

      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold">Family Vault</h2>
        <p>Securely Share Files with your family</p>
      </div>

      <div className="mx-10 mt-8 flex justify-between items-center">
        <h3 className="text-xl font-semibold">Family Members</h3>
        <Link to="/addmember" state={{ members }} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
          Add Member
        </Link>
      </div>

      <div className="mx-10 mt-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Family Members</h3>

          {members.length === 0 ? (
            <p className="text-gray-400">No family members added.</p>
          ) : (
            <ul className="space-y-4">
              {members.map((member, index) => (
                <li key={index} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-bold">{member.name}</p>
                    <p className="text-sm text-gray-600">
                      {member.relation} | Email: {member.mobile}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await api.delete(`/family/delete/${member.id}`);
                        setMembers(members.filter((m) => m.id !== member.id));
                      } catch (e) {
                        alert("Delete failed");
                      }
                    }}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default FamilyVault;

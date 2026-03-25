import { Link } from "react-router-dom";

function EditExpiryReminder() {
  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>
        <div className="flex gap-6">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/expiryreminder">Expiry Reminder</Link>
        </div>
      </div>

      {/* TITLE */}
      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] p-6 rounded-xl text-white">
        <h2 className="text-2xl font-bold">Edit Expiry Reminder</h2>
        <p>Modify expiry date and time</p>
      </div>

      {/* FORM */}
      <div className="mx-10 mt-8 bg-white p-8 rounded-xl shadow">

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">
              Expiry Date
            </label>
            <input type="date" className="w-full border p-3 rounded-lg" />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Expiry Time
            </label>
            <input type="time" className="w-full border p-3 rounded-lg" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">
            Reminder Note
          </label>
          <textarea
            rows="3"
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div className="flex gap-4">
          <button className="bg-blue-700 text-white px-8 py-2 rounded-lg">
            Update Reminder
          </button>

          <Link
            to="/expiryreminder"
            className="border px-8 py-2 rounded-lg"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EditExpiryReminder;

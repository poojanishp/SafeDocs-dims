import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import UploadDocument from "./pages/UploadDocument";
import MyDocuments from "./pages/MyDocuments";
import FamilyVault from "./pages/FamilyVault";
import AddMember from "./pages/AddMember";
import AuditLogs from "./pages/AuditLogs";
import ExpiryReminder from "./pages/ExpiryReminder";  
import TimeBoundLinks from "./pages/TimeBoundLinks";
import SOSMode from "./pages/SOSMode";
import PasswordVault from "./pages/PasswordVault";
import AddExpiryReminder from "./pages/AddExpiryReminder";
import EditExpiryReminder from "./pages/EditExpiryReminder";
import EmergencySetup from "./pages/EmergencySetup";
import AddPassword from "./pages/AddPassword";
import DeleteAccount from "./pages/DeleteAccount";
import Profile from "./pages/Profile";
import { applyTheme, getStoredTheme } from "./utils/theme";

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/UploadDocument" element={<UploadDocument />} />
        <Route path="/mydocuments" element={<MyDocuments />} />
        <Route path="/familyvault" element={<FamilyVault />} />
        <Route path="/addmember" element={<AddMember />} />
        <Route path="/auditlogs" element={<AuditLogs />} />
        <Route path="/expiryreminder" element={<ExpiryReminder />} />
        <Route path="/timeboundlinks" element={<TimeBoundLinks />} />
        <Route path="/sosmode" element={<SOSMode />} />
        <Route path="/passwordvault" element={<PasswordVault />} />
        <Route path="/addexpiryreminder" element={<AddExpiryReminder />} />
        <Route path="/editexpiryreminder" element={<EditExpiryReminder />} />
        <Route path="/emergencysetup" element={<EmergencySetup />} />
        <Route path="/addpassword" element={<AddPassword />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/profile" element={<Profile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./lib/supabase";
import AuthPage from "./components/AuthPage";
import LearningHub from "./App.jsx";
import "./index.css";

function AltiusApp() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = no session
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          setProfile(null);
          setUserData(null);
          setLoadingData(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load profile + user data when session is available
  useEffect(() => {
    if (!session) {
      setLoadingData(false);
      return;
    }

    const loadUserData = async () => {
      setLoadingData(true);
      try {
        // Load profile
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileErr) console.error("Failed to load profile:", profileErr.message);
        if (profileData) setProfile(profileData);

        // Load user data
        const { data: ud, error: dataErr } = await supabase
          .from("user_data")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (dataErr) console.error("Failed to load user data:", dataErr.message);
        setUserData(ud ? (ud.data || {}) : {});
      } catch (err) {
        console.error("Unexpected error loading data:", err);
        setUserData({});
      }
      setLoadingData(false);
    };

    loadUserData();
  }, [session]);

  // Save user data to Supabase (called by the app)
  const saveUserData = async (data) => {
    if (!session) return;
    const { error } = await supabase
      .from("user_data")
      .update({ data })
      .eq("user_id", session.user.id);
    if (error) console.error("Failed to save data:", error.message);
  };

  // Update profile (called by the app)
  const updateProfile = async (updates) => {
    if (!session) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id);
    if (error) console.error("Failed to update profile:", error.message);
    else setProfile((p) => ({ ...p, ...updates }));
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Loading state
  if (session === undefined || (session && loadingData)) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <svg viewBox="0 0 32 32" width={48} height={48} xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated", margin: "0 auto 16px" }}>
            <rect x="14" y="4" width="4" height="4" fill="#4ade80"/>
            <rect x="10" y="8" width="4" height="4" fill="#4ade80"/><rect x="14" y="8" width="4" height="4" fill="#22c55e"/><rect x="18" y="8" width="4" height="4" fill="#4ade80"/>
            <rect x="6" y="12" width="4" height="4" fill="#22c55e"/><rect x="10" y="12" width="4" height="4" fill="#22c55e"/><rect x="14" y="12" width="4" height="4" fill="#16a34a"/><rect x="18" y="12" width="4" height="4" fill="#22c55e"/><rect x="22" y="12" width="4" height="4" fill="#22c55e"/>
            <rect x="2" y="16" width="4" height="4" fill="#16a34a"/><rect x="6" y="16" width="4" height="4" fill="#22c55e"/><rect x="10" y="16" width="4" height="4" fill="#16a34a"/><rect x="14" y="16" width="4" height="4" fill="#22c55e"/><rect x="18" y="16" width="4" height="4" fill="#16a34a"/><rect x="22" y="16" width="4" height="4" fill="#22c55e"/><rect x="26" y="16" width="4" height="4" fill="#16a34a"/>
            <rect x="0" y="20" width="32" height="4" fill="#15803d"/>
            <rect x="0" y="24" width="32" height="8" fill="#166534"/>
          </svg>
          <p className="text-stone-400 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>Loading your trail...</p>
        </div>
      </div>
    );
  }

  // No session — show auth page
  if (!session) {
    return <AuthPage />;
  }

  // Authenticated — show the main app
  return (
    <LearningHub
      user={session.user}
      profile={profile}
      initialData={userData}
      onSave={saveUserData}
      onUpdateProfile={updateProfile}
      onSignOut={handleSignOut}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AltiusApp />
  </React.StrictMode>
);

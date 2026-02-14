import { useState } from "react";
import { supabase } from "../lib/supabase";
import PixelLogo from "./PixelLogo";

// ─── SMALL MOUNTAIN RANGE FOR BACKGROUND ───
const MountainRange = () => (
  <svg viewBox="0 0 800 200" className="w-full" style={{ opacity: 0.06 }} xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,200 80,60 160,200" fill="#0d9488"/>
    <polygon points="120,200 220,30 320,200" fill="#0d9488"/>
    <polygon points="280,200 380,50 480,200" fill="#0d9488"/>
    <polygon points="400,200 520,20 640,200" fill="#0d9488"/>
    <polygon points="580,200 700,45 800,200" fill="#0d9488"/>
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email to confirm your account, then come back and log in!");
      setMode("login");
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset link sent! Check your email.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background mountain silhouette */}
      <div className="absolute bottom-0 left-0 right-0">
        <MountainRange />
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
              <PixelLogo size={48} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-stone-800" style={{ fontFamily: "Georgia, serif" }}>
            Altius
          </h1>
          <p className="text-stone-500 text-sm mt-1">Learn More, Climb Higher</p>
        </div>

        {/* Success message */}
        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm text-center">
            {message}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "reset" && "Reset password"}
          </h2>
          <p className="text-stone-400 text-sm mb-6">
            {mode === "login" && "Sign in to continue your journey"}
            {mode === "signup" && "Start climbing today"}
            {mode === "reset" && "We'll send you a reset link"}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleReset}>
            {/* Display name (signup only) */}
            {mode === "signup" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="What should we call you?"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password (not for reset) */}
            {mode !== "reset" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {mode === "login" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending link..."}
                </span>
              ) : (
                <>
                  {mode === "login" && "Sign in"}
                  {mode === "signup" && "Create account"}
                  {mode === "reset" && "Send reset link"}
                </>
              )}
            </button>
          </form>

          {/* Forgot password (login only) */}
          {mode === "login" && (
            <button
              onClick={() => { setMode("reset"); setError(""); setMessage(""); }}
              className="w-full text-center text-stone-400 hover:text-teal-600 text-sm mt-4 transition-colors"
            >
              Forgot password?
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="text-center mt-6 text-sm text-stone-500">
          {mode === "login" && (
            <>
              New to Altius?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} className="text-teal-600 hover:text-teal-700 font-medium">
                Create an account
              </button>
            </>
          )}
          {(mode === "signup" || mode === "reset") && (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} className="text-teal-600 hover:text-teal-700 font-medium">
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-stone-300 text-xs mt-8" style={{ fontFamily: "'Courier New', monospace" }}>
          ALTIUS COMPUTING CO. — EST. 2026
        </p>
      </div>
    </div>
  );
}

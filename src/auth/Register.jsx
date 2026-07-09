import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext/useAuth";
import { doCreateUserWithEmailAndPassword } from "../firebase/auth";

import React, { useState } from "react";

function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { userLoggedIn } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!isRegistering) {
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      const displayName = name.trim();
      setIsRegistering(true);
      setErrorMessage("");
      await doCreateUserWithEmailAndPassword(email, displayName, password).catch((err) => {
        setErrorMessage(err.message);
        setIsRegistering(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      {userLoggedIn && <Navigate to={"/home"} replace={true} />}

      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-slate-900 px-8 py-10 text-white lg:px-10 lg:py-14">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-slate-100">
            Start fresh
          </span>
          <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">
            Create your invoice workspace in minutes.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Set up your account and bring your invoices, customers, and products into one streamlined dashboard.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-lg">✦</span>
              <span>Get a polished workspace designed for everyday operations.</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-lg">✦</span>
              <span>Keep your data organized without the clutter.</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">
                Create account
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                Get started with your account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign up to manage invoices and keep your workflow smooth.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input
                  disabled={isRegistering}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                <input
                  disabled={isRegistering}
                  type="password"
                  autoComplete="off"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="Re-enter your password"
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className={`w-full rounded-2xl px-4 py-3 font-semibold text-white transition ${
                  isRegistering
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-indigo-600 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                }`}
              >
                {isRegistering ? "Signing Up..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to={"/login"} className="font-semibold text-indigo-600 hover:underline">
                Continue
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

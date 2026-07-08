import React, { useState } from "react";
import { useAuth } from "../contexts/authContext";
import { doSignInWithEmailAndPassword } from "../firebase/auth";
import { Navigate, Link } from "react-router-dom";

function Login() {
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage("");
      await doSignInWithEmailAndPassword(email, password).catch((err) => {
        setErrorMessage(err.message);
        setIsSigningIn(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      {userLoggedIn && <Navigate to={"/home"} replace={true} />}

      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-slate-900 px-8 py-10 text-white lg:px-10 lg:py-14">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-slate-100">
            Invoice Dashboard
          </span>
          <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">
            Manage every invoice with clarity.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Keep your customers, products, and payments organized from a single calm workspace.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-lg">✓</span>
              <span>Track invoices and outstanding balances in real time.</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-lg">✓</span>
              <span>Stay on top of customer and product records instantly.</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">
                Welcome back
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Continue where you left off and keep your business moving.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  placeholder="Enter your password"
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className={`w-full rounded-2xl px-4 py-3 font-semibold text-white transition ${
                  isSigningIn
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-indigo-600 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                }`}
              >
                {isSigningIn ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link to={"/register"} className="font-semibold text-indigo-600 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

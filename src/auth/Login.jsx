import React, { useState } from "react";
import { useAuth } from "../contexts/authContext/useAuth";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "../firebase/auth";
import { Navigate, Link, useNavigate } from "react-router-dom";

function Login() {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage("");
      try {
        await doSignInWithEmailAndPassword(email, password);
        navigate("/home");
      } catch (err) {
        setErrorMessage(err.message);
        setIsSigningIn(false);
      }
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage("");
      try {
        const res = await doSignInWithGoogle();
        if (res?.user) {
          navigate("/home");
        }
      } catch (err) {
        if (err.code === "auth/popup-blocked") {
          setErrorMessage("Popup was blocked by your browser. Please allow popups for this site in your browser bar and try again.");
        } else {
          setErrorMessage(err.message || "Failed to sign in with Google.");
        }
        setIsSigningIn(false);
      }
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

            <div className="my-6 flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">OR</span>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              disabled={isSigningIn}
              onClick={onGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? "Signing In..." : "Continue with Google"}</span>
            </button>

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


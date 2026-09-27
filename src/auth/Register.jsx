import React from "react";
import { SignUp, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";

function Register() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#1e1b4b_100%)] px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/90 shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:grid lg:grid-cols-[1fr_1fr]">
        {/* Left Side Showcase */}
        <div className="flex flex-col justify-between border-b border-white/10 p-8 text-white lg:border-b-0 lg:border-r lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/30">
                I
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Invomora</span>
            </div>

            <h1 className="mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Create Your Workspace in Seconds
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              Set up your account using Clerk Auth for effortless Google, Email, and Social signups.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold">✦</span>
              <div>
                <p className="text-sm font-semibold text-white">No Firebase Auth Boilerplate</p>
                <p className="text-xs text-slate-400">Instant multi-provider sign up</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold">✦</span>
              <div>
                <p className="text-sm font-semibold text-white">Instant Dashboard Access</p>
                <p className="text-xs text-slate-400">Automatic customer & invoice workspace</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Clerk SignUp Widget */}
        <div className="flex items-center justify-center p-6 sm:p-10 bg-slate-950/40">
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            forceRedirectUrl="/home"
            fallbackRedirectUrl="/home"
          />
        </div>
      </div>
    </div>
  );
}

export default Register;



"use client";

import { useState, FormEvent, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [approvedFields, setApprovedFields] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Field validity checks
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const isPasswordValid = useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const isConfirmPasswordValid = useMemo(() => {
    return confirmPassword.length >= 6 && confirmPassword === password;
  }, [confirmPassword, password]);

  const isFormValid = useMemo(() => {
    if (mode === "signin") {
      return isEmailValid && isPasswordValid;
    }
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid &&
      approvedFields
    );
  }, [
    mode,
    isEmailValid,
    isPasswordValid,
    firstName,
    lastName,
    isConfirmPasswordValid,
    approvedFields,
  ]);

  const getInputClass = (isValid: boolean, hasValue: boolean, extraClasses = "") => {
    const base =
      "w-full rounded-md bg-bewachen-surface px-4 py-3.5 text-lg text-slate-100 placeholder:text-slate-500 transition-all duration-300 [color-scheme:dark]";
    if (hasValue && isValid) {
      return `${base} border-2 border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.35)] focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 ${extraClasses}`;
    }
    return `${base} border-2 border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${extraClasses}`;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please recheck your password.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (!approvedFields) {
        setError("Please approve that all your inputted fields are correct to proceed.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const fullName = `${firstName} ${lastName}`.trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: fullName ? { data: { full_name: fullName } } : undefined,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (!data.session) {
          setInfo("Check your inbox and confirm your email, then sign in.");
        } else {
          router.replace("/");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          router.replace("/");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-slate-100 flex items-center justify-center p-4 sm:p-8 lg:p-12">
      {/* Centered Dual-Panel Layout (No outer background box) */}
      <div className="w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: Visual Hero Panel (Clean image only + BEWACHEN title) */}
        <div className="relative lg:col-span-5 rounded-lg overflow-hidden min-h-[300px] sm:min-h-[420px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-8 shadow-xl">
          {/* Atmospheric Background Image */}
          <Image
            src="/images/auth-hero.jpg"
            alt="Bewachen"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-center filter brightness-[0.92] contrast-[1.05]"
          />

          {/* Clean Top Bar: Text Only (No shield logo, no SOS) */}
          <div className="relative z-10">
            <span className="text-xl font-extrabold tracking-wider text-white drop-shadow-md">
              BEWACHEN
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Minimal Form Panel */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            {/* Header: Title ('Welcome' or 'Create an account') */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
                {mode === "signup" ? "Create an account" : "Welcome"}
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First & Last Name Fields (when in signup mode) */}
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first-name" className="sr-only">First Name</label>
                    <input
                      id="first-name"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={getInputClass(firstName.trim().length > 0, firstName.length > 0)}
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="sr-only">Last Name</label>
                    <input
                      id="last-name"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={getInputClass(lastName.trim().length > 0, lastName.length > 0)}
                    />
                  </div>
                </div>
              )}

              {/* Email Field with Glow on Valid Input */}
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={getInputClass(isEmailValid, email.length > 0)}
                />
              </div>

              {/* Password Field with Glow on Valid Input and Eye Toggle */}
              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "Enter your password (min 6 characters)" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={getInputClass(isPasswordValid, password.length > 0, `pr-14 ${showPassword ? "password-plain" : "password-mask"}`)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword((prev) => !prev);
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                </button>
              </div>

              {/* Confirm Password Field (Signup mode only) with Glow on Valid Matching Input */}
              {mode === "signup" && (
                <div className="relative">
                  <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={getInputClass(isConfirmPasswordValid, confirmPassword.length > 0, `pr-14 ${showConfirmPassword ? "password-plain" : "password-mask"}`)}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowConfirmPassword((prev) => !prev);
                    }}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                  </button>
                </div>
              )}

              {/* Approval Checkbox (Create Account page only) */}
              {mode === "signup" && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    id="approval"
                    type="checkbox"
                    checked={approvedFields}
                    onChange={(e) => setApprovedFields(e.target.checked)}
                    className="h-5 w-5 rounded-sm border-2 border-slate-600 bg-bewachen-surface text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="approval" className="text-base text-slate-200 select-none cursor-pointer">
                    I approve that all my inputted fields are correct to my knowledge
                  </label>
                </div>
              )}

              {/* Error & Info Alerts */}
              {error && (
                <div role="alert" className="rounded-md border border-red-500/30 bg-red-950/20 px-4 py-3 text-base font-semibold text-red-400">
                  {error}
                </div>
              )}
              {info && (
                <div role="status" className="rounded-md border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-base font-semibold text-emerald-400">
                  {info}
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full rounded-md bg-blue-600 hover:bg-blue-500 py-4 text-xl font-bold text-white shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:shadow-none flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="h-6 w-6 animate-spin" />
                    <span>Please wait…</span>
                  </>
                ) : (
                  <span>{mode === "signup" ? "Create account" : "Sign in"}</span>
                )}
              </button>

              {/* Sign up / Sign in Toggle - Prominently positioned at the bottom of the action button */}
              <div className="pt-6 pb-2 text-center mt-4">
                {mode === "signin" ? (
                  <p className="text-base sm:text-lg text-slate-300">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setConfirmPassword("");
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                        setApprovedFields(false);
                        setError(null);
                        setInfo(null);
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors ml-1.5 text-lg"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p className="text-base sm:text-lg text-slate-300">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setConfirmPassword("");
                        setShowPassword(false);
                        setShowConfirmPassword(false);
                        setError(null);
                        setInfo(null);
                      }}
                      className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors ml-1.5 text-lg"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

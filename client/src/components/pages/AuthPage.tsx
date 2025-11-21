import React, { useState } from "react";
import API from "../../api/axios";
import { AnalyticsIcon, SpinnerIcon, ArrowLeftIcon } from "../ui/Icons";
import { UserCredentials } from "../../types";

type AuthStep = "initial" | "signin" | "signup";

interface AuthPageProps {
  onLoginSuccess: (email: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<AuthStep>("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post(`/expenzo/users/login`, {
        email: email.toLowerCase(),
        password,
      });

      localStorage.setItem("token", res.data.token);
      if (rememberMe) localStorage.setItem("rememberedUser", email.toLowerCase());
      onLoginSuccess(res.data.email);

    } catch (err: any) {
      console.error("Login error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";

      if (String(message).toLowerCase().includes("invalid email")) {
        setError("No account found. Let's create one!");
        setStep("signup");
        setConfirmPassword("");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // SIGNUP
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.post(`/expenzo/users/register`, {
        email: email.toLowerCase(),
        password,
      });

      localStorage.setItem("token", res.data.token);
      if (rememberMe) localStorage.setItem("rememberedUser", email.toLowerCase());
      onLoginSuccess(res.data.email);

    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (targetStep: AuthStep) => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setIsLoading(false);
    setRememberMe(false);
    setStep(targetStep);
  };

  const renderContent = () => {
    switch (step) {
      case "signin":
        return (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => resetForm("initial")}
              className="flex items-center text-sm font-semibold text-gray-500 hover:text-gray-800 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
            </button>

            <h2 className="text-3xl font-bold text-center text-gray-800">Sign In</h2>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border rounded-lg"
              autoFocus
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border rounded-lg"
            />

            <div className="flex items-center mt-4">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg flex items-center justify-center"
            >
              {isLoading ? <SpinnerIcon className="animate-spin h-6 w-6" /> : "Sign In"}
            </button>
          </form>
        );

      case "signup":
        return (
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            <button
              type="button"
              onClick={() => resetForm("initial")}
              className="flex items-center text-sm font-semibold text-gray-500 hover:text-gray-800 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
            </button>

            <h2 className="text-3xl font-bold text-center text-gray-800">
              Create your account
            </h2>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border rounded-lg"
              autoFocus
            />

            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border rounded-lg"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border rounded-lg"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg flex items-center justify-center"
            >
              {isLoading ? (
                <SpinnerIcon className="animate-spin h-6 w-6" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        );

      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to expenzo</h2>
            <p className="text-gray-500 mb-10">Your personal finance companion.</p>

            <div className="space-y-4">
              <button
                onClick={() => setStep("signin")}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg"
              >
                Sign In
              </button>

              <button
                onClick={() => setStep("signup")}
                className="w-full px-4 py-3 text-primary-600 bg-white border-2 border-primary-600 rounded-lg"
              >
                Create Account
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="flex items-center mb-8">
        <div className="bg-primary-600 p-3 rounded-xl">
          <AnalyticsIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold ml-4 text-gray-800">expenzo</h1>
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthPage;

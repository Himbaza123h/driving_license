"use client";
import React, { useState } from "react";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

type AuthView = "signin" | "signup" | "forgot-password" | "reset-password";

interface AuthManagerProps {
  initialView?: AuthView;
  resetTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

const AuthManager: React.FC<AuthManagerProps> = ({ 
  initialView = "signin",
  resetTokens 
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);

  const handleSwitchToSignIn = () => setCurrentView("signin");
  const handleSwitchToSignUp = () => setCurrentView("signup");
  const handleSwitchToForgotPassword = () => setCurrentView("forgot-password");

  const renderCurrentView = () => {
    switch (currentView) {
      case "signin":
        return (
          <SignIn
            onSwitchToSignUp={handleSwitchToSignUp}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
          />
        );
      case "signup":
        return (
          <SignUp
            onSwitchToSignIn={handleSwitchToSignIn}
          />
        );
      case "forgot-password":
        return (
          <ForgotPassword
            onSwitchToSignIn={handleSwitchToSignIn}
          />
        );
      case "reset-password":
        return (
          <ResetPassword
            onSwitchToSignIn={handleSwitchToSignIn}
            accessToken={resetTokens?.accessToken || ""}
            refreshToken={resetTokens?.refreshToken || ""}
          />
        );
      default:
        return (
          <SignIn
            onSwitchToSignUp={handleSwitchToSignUp}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default AuthManager;
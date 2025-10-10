// noinspection SpellCheckingInspection

import React from "react";
import AuthForm from "../components/AuthForm";

interface AuthPageProps {
  embedded?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ embedded = false }) => {
  if (embedded) {
    return (
      <div className="space-y-4">
        <AuthForm embedded />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            GetSticked
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Votre compagnon de suivi et de compétition
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthPage;

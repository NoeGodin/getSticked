import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { LoginForm, SignUpForm } from "../types/auth.types";

interface AuthFormProps {
  embedded?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ embedded = false }) => {
  const { signIn, signUp } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState<SignUpForm>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(loginForm.email, loginForm.password);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      await signUp(
        signUpForm.email,
        signUpForm.password,
        signUpForm.displayName
      );
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex border-b mb-6">
          <button
            type="button"
            className={`flex-1 py-2 px-4 text-center font-medium ${
              isLoginMode
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setIsLoginMode(true)}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 text-center font-medium ${
              !isLoginMode
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setIsLoginMode(false)}
          >
            Inscription
          </button>
        </div>

        {isLoginMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor={embedded ? "email" : "email-full"}
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id={embedded ? "email" : "email-full"}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label
                htmlFor={embedded ? "password" : "password-full"}
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id={embedded ? "password" : "password-full"}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label
                htmlFor={embedded ? "displayName" : "displayName-full"}
                className="block text-sm font-medium text-gray-700"
              >
                Nom d'affichage
              </label>
              <input
                id={embedded ? "displayName" : "displayName-full"}
                name="displayName"
                type="text"
                required
                value={signUpForm.displayName}
                onChange={(e) =>
                  setSignUpForm({
                    ...signUpForm,
                    displayName: e.target.value,
                  })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label
                htmlFor={embedded ? "signup-email" : "signup-email-full"}
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id={embedded ? "signup-email" : "signup-email-full"}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={signUpForm.email}
                onChange={(e) =>
                  setSignUpForm({ ...signUpForm, email: e.target.value })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label
                htmlFor={embedded ? "signup-password" : "signup-password-full"}
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id={embedded ? "signup-password" : "signup-password-full"}
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={signUpForm.password}
                onChange={(e) =>
                  setSignUpForm({ ...signUpForm, password: e.target.value })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
              />
            </div>
            <div>
              <label
                htmlFor={embedded ? "confirmPassword" : "confirmPassword-full"}
                className="block text-sm font-medium text-gray-700"
              >
                Confirmer le mot de passe
              </label>
              <input
                id={embedded ? "confirmPassword" : "confirmPassword-full"}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={signUpForm.confirmPassword}
                onChange={(e) =>
                  setSignUpForm({
                    ...signUpForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirmer le mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer un compte"}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AuthForm;

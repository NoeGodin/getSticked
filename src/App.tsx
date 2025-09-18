import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";
import { useEffect } from "react";
import { InvitationService } from "./services/invitation.service";

const AppContent = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleInvitation = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get("invite");
      
      if (inviteToken && user) {
        try {
          const result = await InvitationService.useInvitation(inviteToken, user);
          // Clear the invite parameter from URL
          urlParams.delete("invite");
          const newUrl = `${window.location.origin}${window.location.pathname}${urlParams.toString() ? `?${urlParams}` : ''}`;
          window.history.replaceState({}, document.title, newUrl);
          // Redirect to room
          window.location.hash = `/room/${result.roomId}`;
        } catch (error) {
          console.error("Failed to use invitation:", error);
          // Could show a toast notification here
        }
      }
    };

    handleInvitation();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Chargement...
          </h2>
        </div>
      </div>
    );
  }

  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get("invite");
  
  if (!user) {
    if (inviteToken) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Rejoindre un salon
            </h2>
            <p className="text-gray-600 mb-6">
              Vous devez vous connecter pour rejoindre ce salon.
            </p>
            <AuthPage />
          </div>
        </div>
      );
    }
    return <AuthPage />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Create Room */}
        <Route path="/create" element={<CreateRoomForm />} />

        {/* Game - with room ID parameter */}
        <Route path="/room/:roomId" element={<DualStickCounter />} />
      </Routes>
    </HashRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

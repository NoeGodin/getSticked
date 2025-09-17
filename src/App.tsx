import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateRoomForm from "./pages/CreateRoomForm.tsx";
import JoinRoomForm from "./pages/JoinRoomForm.tsx";
import DualStickCounter from "./components/DualStickCounter";

const AppContent = () => {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <AuthPage />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Create Room */}
        <Route path="/create" element={<CreateRoomForm />} />

        {/* Join Room */}
        <Route path="/join" element={<JoinRoomForm />} />

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

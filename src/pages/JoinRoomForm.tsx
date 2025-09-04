import React, { useState } from "react";
import { ArrowLeft, Key, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { JoinRoomForm as JoinRoomFormData } from "../types/room.types";
import type { UserSession } from "../types/session.types";
import { verifRoomId } from "../utils/form.ts";
import { RoomService } from "../services/room.service.ts";

interface JoinRoomFormProps {
  setUserSession: (session: UserSession) => void;
}

const JoinRoomForm: React.FC<JoinRoomFormProps> = ({ setUserSession }) => {
  const [formData, setFormData] = useState<JoinRoomFormData>({
    name: "",
    secretKey: "",
  });

  const [errors, setErrors] = useState<Partial<JoinRoomFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (field: keyof JoinRoomFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<JoinRoomFormData> = verifRoomId(formData, {});

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      try {
        const room = await RoomService.joinRoom(formData);

        if (!room) {
          setErrors({
            name: "Salon introuvable ou clé secrète incorrecte",
          });
          return;
        }

        // USER SESSION MANAGEMENT
        const currentSession = JSON.parse(
          localStorage.getItem("userSession") ||
            '{"joinedRooms":[],"currentRoomName":null}',
        ) as UserSession;
        const existingRoom = currentSession.joinedRooms.find(
          (joinedRoom) => joinedRoom.name === formData.name,
        );

        let updatedSession: UserSession;
        if (existingRoom) {
          updatedSession = {
            ...currentSession,
            currentRoomName: formData.name,
            joinedRooms: currentSession.joinedRooms.map((joinedRoom) =>
              joinedRoom.name === formData.name
                ? { ...joinedRoom, lastVisited: new Date().toISOString() }
                : joinedRoom,
            ),
          };
        } else {
          updatedSession = {
            ...currentSession,
            currentRoomName: formData.name,
            joinedRooms: [
              ...currentSession.joinedRooms,
              {
                name: formData.name,
                secretKey: formData.secretKey,
                lastVisited: new Date().toISOString(),
                joinedAt: new Date().toISOString(),
              },
            ],
          };
        }

        setUserSession(updatedSession);

        navigate("/game");
      } catch (error) {
        console.error("Error joining room:", error);
        setErrors({ name: "Erreur lors de la connexion au salon" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Rejoindre un Salon
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-2" />
              Nom du Salon
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: NoeXAlex:Biere"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key size={16} className="inline mr-2" />
              Clé Secrète
            </label>
            <input
              type="text"
              value={formData.secretKey}
              onChange={(e) => handleInputChange("secretKey", e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.secretKey ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: ABC123"
            />
            {errors.secretKey && (
              <p className="mt-1 text-sm text-red-600">{errors.secretKey}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {isLoading ? "Connexion..." : "Rejoindre"}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Besoin d'aide ?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Le nom du salon et la clé sont sensibles à la casse</li>
            <li>
              • Contactez le créateur si vous ne pouvez pas vous connecter
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomForm;

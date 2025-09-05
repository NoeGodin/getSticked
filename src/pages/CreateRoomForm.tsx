import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Key, User, Users } from "lucide-react";
import type { CreateRoomForm as CreateRoomFormData } from "../types/room.types";
import type { UserSession } from "../types/session.types";
import { verifRoomId } from "../utils/form.ts";
import { RoomService } from "../services/room.service.ts";

interface Props {
  setUserSession: (session: UserSession) => void;
}

export default function CreateRoomForm({ setUserSession }: Props) {
  const [formData, setFormData] = useState<CreateRoomFormData>({
    name: "",
    secretKey: "",
    description: "",
    player1Name: "",
    player2Name: "",
  });

  const [errors, setErrors] = useState<Partial<CreateRoomFormData>>({});
  const navigate = useNavigate();

  const handleInputChange = (
    field: keyof CreateRoomFormData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateRoomFormData> = verifRoomId(formData, {});

    if (!formData.player1Name.trim()) {
      newErrors.player1Name = "Le nom du joueur 1 est requis";
    }

    if (!formData.player2Name.trim()) {
      newErrors.player2Name = "Le nom du joueur 2 est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSecretKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange("secretKey", result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const roomId = await RoomService.createRoom(formData);

        const updateSession = (prev: UserSession) => ({
          ...prev,
          currentRoomName: formData.name,
          joinedRooms: [
            ...prev.joinedRooms,
            {
              name: formData.name,
              secretKey: formData.secretKey,
              lastVisited: new Date().toISOString(),
              joinedAt: new Date().toISOString(),
            },
          ],
        });

        // Get current session from localStorage or default
        const currentSession = JSON.parse(
          localStorage.getItem("userSession") ||
            '{"joinedRooms":[],"currentRoomName":null}',
        ) as UserSession;
        setUserSession(updateSession(currentSession));

        // Navigate to the new room using its ID
        navigate(`/room/${roomId}`);
      } catch (error) {
        console.error("Error creating room:", error);
        setErrors({ name: "Erreur lors de la création du salon" });
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleCancel}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Créer un Salon</h1>
        </div>

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
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.secretKey}
                onChange={(e) => handleInputChange("secretKey", e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.secretKey ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: ABC123"
              />
              <button
                type="button"
                onClick={generateSecretKey}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Générer
              </button>
            </div>
            {errors.secretKey && (
              <p className="mt-1 text-sm text-red-600">{errors.secretKey}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-2" />
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: À chaque bière bue, 1 bâton !"
              rows={3}
            />
          </div>

          {/* Player Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Joueur 1
              </label>
              <input
                type="text"
                value={formData.player1Name}
                onChange={(e) =>
                  handleInputChange("player1Name", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.player1Name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: Noé"
              />
              {errors.player1Name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.player1Name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Joueur 2
              </label>
              <input
                type="text"
                value={formData.player2Name}
                onChange={(e) =>
                  handleInputChange("player2Name", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.player2Name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: Alex"
              />
              {errors.player2Name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.player2Name}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              Créer le Salon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Key, Plus, Users, X } from "lucide-react";
import type { CreateRoomForm as CreateRoomFormData } from "../types/room.types";
import type { UserSession } from "../types/session.types";
import { RoomService } from "../services/room.service.ts";

interface Props {
  setUserSession: (session: UserSession) => void;
}

export default function CreateRoomForm({ setUserSession }: Props) {
  const [formData, setFormData] = useState<CreateRoomFormData>({
    name: "",
    secretKey: "",
    description: "",
    playerNames: ["", ""], // Start with 2 players minimum
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
        [field]: "",
      }));
    }
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      playerNames: prev.playerNames.map((name, i) => 
        i === index ? value : name
      ),
    }));

    // Clear error for this player
    const errorKey = `player${index}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "",
      }));
    }
  };

  const addPlayer = () => {
    if (formData.playerNames.length < 8) { // Max 8 players
      setFormData((prev) => ({
        ...prev,
        playerNames: [...prev.playerNames, ""],
      }));
    }
  };

  const removePlayer = (index: number) => {
    if (formData.playerNames.length > 2) { // Minimum 2 players
      setFormData((prev) => ({
        ...prev,
        playerNames: prev.playerNames.filter((_, i) => i !== index),
      }));
      
      // Clear any error for removed player
      const errorKey = `player${index}`;
      if (errors[errorKey]) {
        setErrors((prev) => ({
          ...prev,
          [errorKey]: "",
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate basic room info
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du salon est requis";
    }
    if (!formData.secretKey.trim()) {
      newErrors.secretKey = "La clé secrète est requise";
    }

    // Validate player names
    formData.playerNames.forEach((name, index) => {
      if (!name.trim()) {
        newErrors[`player${index}`] = `Le nom du joueur ${index + 1} est requis`;
      }
    });

    // Check for duplicate names
    const names = formData.playerNames.filter(name => name.trim());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      formData.playerNames.forEach((name, index) => {
        if (duplicates.includes(name)) {
          newErrors[`player${index}`] = "Ce nom de joueur est déjà utilisé";
        }
      });
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

    if (isSubmitting) return; // Prevent double submission

    if (validateForm()) {
      try {
        setIsSubmitting(true);
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
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
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
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                <Users size={16} className="inline mr-2" />
                Joueurs ({formData.playerNames.length})
              </label>
              {formData.playerNames.length < 8 && (
                <button
                  type="button"
                  onClick={addPlayer}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                >
                  <Plus size={14} />
                  <span>Ajouter</span>
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {formData.playerNames.map((playerName, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`player${index}`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={`Joueur ${index + 1}`}
                    />
                    {errors[`player${index}`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors[`player${index}`]}
                      </p>
                    )}
                  </div>
                  {formData.playerNames.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="mt-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Supprimer ce joueur"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
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
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Création...' : 'Créer le Salon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

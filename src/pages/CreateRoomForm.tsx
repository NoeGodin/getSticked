import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Users } from "lucide-react";
import type { CreateRoomForm as CreateRoomFormData } from "../types/room.types";
import { RoomService } from "../services/room.service.ts";
import { useAuth } from "../contexts/AuthContext";

export default function CreateRoomForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateRoomFormData>({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleInputChange = (
    field: keyof CreateRoomFormData,
    value: string
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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate room name
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du salon est requis";
    } else if (formData.name.length < 3) {
      newErrors.name = "Le nom doit contenir au moins 3 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    if (validateForm()) {
      try {
        setIsSubmitting(true);
        const roomId = await RoomService.createRoom(formData, user);
        navigate(`/room/${roomId}`);
      } catch (error) {
        console.error("Error creating room:", error);
        setErrors({ name: "Erreur lors de la création du salon" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Créer un salon
          </h1>
          <p className="text-gray-600 mb-8">
            Créez votre salon de compétition. Les participants pourront le
            rejoindre via une invitation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* StickRoom Name */}
            <div>
              <label
                htmlFor="name"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
              >
                <Users size={16} />
                <span>Nom du salon</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Ex: Compétition Push-ups"
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2"
              >
                <FileText size={16} />
                <span>Description (optionnelle)</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Décrivez les règles ou l'objectif de votre compétition..."
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">Optionnel</p>
                <p className="text-xs text-gray-400">
                  {formData.description.length}/200
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isSubmitting ? "Création..." : "Créer le salon"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

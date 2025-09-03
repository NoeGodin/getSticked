import React, { useState } from "react";
import { ArrowLeft, Key, Users } from "lucide-react";
import type { JoinRoomForm as JoinRoomFormData } from "../types/room.types.ts";

interface JoinRoomFormProps {
  onSubmit: (formData: JoinRoomFormData) => void;
  onCancel: () => void;
}

const JoinRoomForm: React.FC<JoinRoomFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<JoinRoomFormData>({
    name: "",
    secretKey: "",
  });

  const [errors, setErrors] = useState<Partial<JoinRoomFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof JoinRoomFormData, value: string) => {
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
    const newErrors: Partial<JoinRoomFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du salon est requis";
    } else if (formData.name.length < 3) {
      newErrors.name = "Le nom doit contenir au moins 3 caractères";
    }

    if (!formData.secretKey.trim()) {
      newErrors.secretKey = "La clé secrète est requise";
    } else if (formData.secretKey.length < 4) {
      newErrors.secretKey = "La clé doit contenir au moins 4 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // TODO: Replace with actual API call
        const roomExists = true; // Simulate room exists
        const secretKeyValid = true; // Simulate valid secret key

        if (!roomExists) {
          setErrors({ name: "Ce salon n'existe pas" });
          return;
        }

        if (!secretKeyValid) {
          setErrors({ secretKey: "Clé secrète incorrecte" });
          return;
        }

        onSubmit(formData);
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
            onClick={onCancel}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Rejoindre un Salon
          </h1>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Astuce:</strong> Demandez le nom du salon et la clé
            secrète à la personne qui l'a créée.
          </p>
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
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Partie du vendredi"
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
              onChange={(e) =>
                handleInputChange("secretKey", e.target.value.toUpperCase())
              }
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed uppercase ${
                errors.secretKey ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: ABC123"
              style={{ textTransform: "uppercase" }}
            />
            {errors.secretKey && (
              <p className="mt-1 text-sm text-red-600">{errors.secretKey}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connexion...
                </>
              ) : (
                "Rejoindre"
              )}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Besoin d'aide ?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Le nom du salon est sensible à la casse</li>
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

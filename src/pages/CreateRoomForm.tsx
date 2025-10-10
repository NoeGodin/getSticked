import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Palette, Plus, Users } from "lucide-react";
import type { CreateRoomForm as CreateRoomFormData } from "../types/room.types";
import type { ItemType } from "../types/item-type.types";
import { RoomService } from "../services/room.service.ts";
import { ItemTypeService } from "../services/item-type.service.ts";
import { useAuth } from "../hooks/useAuth";
import CreateItemTypeModal from "../components/CreateItemTypeModal";
import Loading from "../components/Loading";

interface ExtendedCreateRoomForm extends CreateRoomFormData {
  itemTypeId: string;
}

export default function CreateRoomForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExtendedCreateRoomForm>({
    name: "",
    description: "",
    itemTypeId: "",
  });
  const [genericTypes, setGenericTypes] = useState<ItemType[]>([]);
  const [userTypes, setUserTypes] = useState<ItemType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(true);
  const [showCreateTypeModal, setShowCreateTypeModal] =
    useState<boolean>(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadItemTypes = async () => {
      try {
        const allTypes = await ItemTypeService.getAvailableTypes(user?.uid);

        const generic = allTypes.filter((type) => type.isGeneric);
        const userCreated = allTypes.filter((type) => !type.isGeneric);

        setGenericTypes(generic);
        setUserTypes(userCreated);
      } catch (error) {
        console.error("Error loading item types:", error);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    loadItemTypes().catch((error) =>
      console.error("Failed to load item types:", error)
    );
  }, [user]);

  const handleInputChange = (
    field: keyof ExtendedCreateRoomForm,
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

  const handleTypeSelect = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      itemTypeId: typeId,
    }));
  };

  const handleTypeCreated = async (typeId: string) => {
    // Reload available types to include the new one
    try {
      const allTypes = await ItemTypeService.getAvailableTypes(user?.uid);
      const generic = allTypes.filter((type) => type.isGeneric);
      const userCreated = allTypes.filter((type) => !type.isGeneric);

      setGenericTypes(generic);
      setUserTypes(userCreated);

      // Auto-select the newly created type
      setFormData((prev) => ({
        ...prev,
        itemTypeId: typeId,
      }));
    } catch (error) {
      console.error("Error reloading types:", error);
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

    // Validate type selection
    if (!formData.itemTypeId) {
      newErrors.itemTypeId = "Veuillez sélectionner un type";
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
        const roomData = {
          name: formData.name,
          description: formData.description,
          itemTypeId: formData.itemTypeId,
        };
        const roomId = await RoomService.createRoom(roomData, user);
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
    <>
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

              {/* Type Selection */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-4">
                  <Palette size={16} />
                  <span>Type de comptage</span>
                </label>

                {errors.itemTypeId && (
                  <p className="mb-2 text-sm text-red-600">
                    {errors.itemTypeId}
                  </p>
                )}

                {isLoadingTypes ? (
                  <div className="text-center py-8">
                    <Loading
                      size="lg"
                      message="Chargement des types..."
                      variant="inline"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Types prédéfinis */}
                    {genericTypes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Types prédéfinis
                        </h3>
                        <div className="grid gap-3">
                          {genericTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                formData.itemTypeId === type.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() =>
                                type.id && handleTypeSelect(type.id)
                              }
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  name="itemType"
                                  checked={formData.itemTypeId === type.id}
                                  onChange={() =>
                                    type.id && handleTypeSelect(type.id)
                                  }
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                      {type.options[0]?.emoji || "📦"}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {type.name}
                                    </span>
                                  </div>
                                  {type.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {type.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className="text-xs text-gray-500">
                                      Options:
                                    </span>
                                    <div className="flex space-x-1">
                                      {type.options
                                        .slice(0, 4)
                                        .map((option) => (
                                          <span
                                            key={option.id}
                                            className="text-sm"
                                            title={`${option.name} (${option.points} pts)`}
                                          >
                                            {option.emoji}
                                          </span>
                                        ))}
                                      {type.options.length > 4 && (
                                        <span className="text-xs text-gray-400">
                                          +{type.options.length - 4}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Types personnalisés de l'utilisateur */}
                    {userTypes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Vos types personnalisés
                        </h3>
                        <div className="grid gap-3">
                          {userTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                formData.itemTypeId === type.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() =>
                                type.id && handleTypeSelect(type.id)
                              }
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  name="itemType"
                                  checked={formData.itemTypeId === type.id}
                                  onChange={() =>
                                    type.id && handleTypeSelect(type.id)
                                  }
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                      {type.options[0]?.emoji || "📦"}
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {type.name}
                                    </span>
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      Personnalisé
                                    </span>
                                  </div>
                                  {type.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {type.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className="text-xs text-gray-500">
                                      Options:
                                    </span>
                                    <div className="flex space-x-1">
                                      {type.options
                                        .slice(0, 4)
                                        .map((option) => (
                                          <span
                                            key={option.id}
                                            className="text-sm"
                                            title={`${option.name} (${option.points} pts)`}
                                          >
                                            {option.emoji}
                                          </span>
                                        ))}
                                      {type.options.length > 4 && (
                                        <span className="text-xs text-gray-400">
                                          +{type.options.length - 4}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bouton créer un type personnalisé */}
                    <div>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => setShowCreateTypeModal(true)}
                      >
                        <div className="flex items-center justify-center space-x-3 text-gray-600">
                          <Plus size={20} />
                          <span className="font-medium">
                            Créer un type personnalisé
                          </span>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-2">
                          Définissez vos propres options et points
                        </p>
                      </div>
                    </div>

                    {genericTypes.length === 0 && userTypes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>Aucun type disponible</p>
                        <p className="text-sm mt-1">
                          Créez votre premier type personnalisé
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {
                /* Submit Button */
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
              }
            </form>
          </div>
        </div>
      </div>

      {/* Create Item Type Modal */}
      <CreateItemTypeModal
        isOpen={showCreateTypeModal}
        onClose={() => setShowCreateTypeModal(false)}
        onTypeCreated={handleTypeCreated}
      />
    </>
  );
}

// noinspection SpellCheckingInspection

import React, { useState } from "react";
import { Palette, Plus, Trash2, X } from "lucide-react";
import type {
  CreateItemOptionForm,
  CreateItemTypeForm,
} from "../types/item-type.types";
import { ItemTypeService } from "../services/item-type.service";
import { useAuth } from "../hooks/useAuth";

interface CreateItemTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeCreated: (typeId: string) => void;
}

export default function CreateItemTypeModal({
  isOpen,
  onClose,
  onTypeCreated,
}: CreateItemTypeModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateItemTypeForm>({
    name: "",
    description: "",
    options: [{ name: "", emoji: "", points: 1 }],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputChange = (
    field: keyof CreateItemTypeForm,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleOptionChange = (
    index: number,
    field: keyof CreateItemOptionForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));

    const errorKey = `option_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "",
      }));
    }
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { name: "", emoji: "", points: 1 }],
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du type est requis";
    } else if (formData.name.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (formData.options.length === 0) {
      newErrors.options = "Au moins une option est requise";
    }

    formData.options.forEach((option, index) => {
      if (!option.name.trim()) {
        newErrors[`option_${index}_name`] = "Le nom de l'option est requis";
      }
      if (!option.emoji.trim()) {
        newErrors[`option_${index}_emoji`] = "L'emoji est requis";
      }
      if (option.points < 1) {
        newErrors[`option_${index}_points`] =
          "Les points doivent être positifs";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    if (validateForm()) {
      try {
        setIsSubmitting(true);
        const typeId = await ItemTypeService.createCustomType(
          formData,
          user.uid
        );
        onTypeCreated(typeId);
        handleClose();
      } catch (error) {
        console.error("Error creating item type:", error);
        setErrors({ name: "Erreur lors de la création du type" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      options: [{ name: "", emoji: "", points: 1 }],
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Créer un type personnalisé
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Name */}
          <div>
            <label
              htmlFor="typeName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nom du type
            </label>
            <input
              type="text"
              id="typeName"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Ex: Ma buvette personnalisée"
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="typeDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (optionnelle)
            </label>
            <textarea
              id="typeDescription"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Décrivez votre type personnalisé..."
              maxLength={200}
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Options du type
              </label>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus size={16} />
                <span>Ajouter une option</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Option {index + 1}
                    </span>
                    {formData.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Option Name */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) =>
                          handleOptionChange(index, "name", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                          errors[`option_${index}_name`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Ex: Bière"
                        maxLength={30}
                      />
                      {errors[`option_${index}_name`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`option_${index}_name`]}
                        </p>
                      )}
                    </div>

                    {/* Option Emoji */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Emoji
                      </label>
                      <input
                        type="text"
                        value={option.emoji}
                        onChange={(e) =>
                          handleOptionChange(index, "emoji", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center ${
                          errors[`option_${index}_emoji`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="🍺"
                        maxLength={4}
                      />
                      {errors[`option_${index}_emoji`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`option_${index}_emoji`]}
                        </p>
                      )}
                    </div>

                    {/* Option Points */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={option.points}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "points",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                          errors[`option_${index}_points`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="50"
                      />
                      {errors[`option_${index}_points`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`option_${index}_points`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Option Color (optional) */}
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      Couleur (optionnelle)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Palette size={16} className="text-gray-400" />
                      <input
                        type="color"
                        value={option.color || "#3B82F6"}
                        onChange={(e) =>
                          handleOptionChange(index, "color", e.target.value)
                        }
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">
                        Couleur d'affichage
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.options && (
              <p className="mt-2 text-sm text-red-600">{errors.options}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? "Création..." : "Créer le type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

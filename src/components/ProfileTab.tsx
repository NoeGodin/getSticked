import React, { useRef, useState } from "react";
import { ArrowLeft, Camera, Save, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { UserService } from "../services/user.service";
import { ImageUploadService } from "../services/image-upload.service";
import type { AuthUser } from "../types/auth.types";

interface ProfileTabProps {
  onBack: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onBack }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    photoURL: user?.photoURL || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(
    user?.photoURL || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Preview
      const previewUrl = await ImageUploadService.createPreviewURL(file);
      setPreviewImage(previewUrl);
      setSelectedFile(file);

      // Don't update yet, do it when saving
    } catch (error) {
      console.error("Error creating preview:", error);
      alert("Erreur lors de la prévisualisation de l'image.");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    let newPhotoURL = formData.photoURL;

    try {
      // If new image selected upload first
      if (selectedFile) {
        setIsUploadingImage(true);

        try {
          // delete old later
          if (user.photoURL) {
            await ImageUploadService.deleteProfileImage(user.photoURL);
          }

          // upload
          newPhotoURL = await ImageUploadService.uploadProfileImage(
            selectedFile,
            user.uid
          );
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          alert(
            "Erreur lors de l'upload de l'image. Sauvegarde des autres informations..."
          );
          // continue with old photourl
          newPhotoURL = user.photoURL || "";
        } finally {
          setIsUploadingImage(false);
        }
      }

      const updates: Partial<AuthUser> = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        photoURL: newPhotoURL,
      };

      // updaye in firebase
      await UserService.updateUserProfile(user.uid, updates);

      // update local context
      await updateProfile(updates);

      // Reset
      setSelectedFile(null);

      onBack();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      alert("Erreur lors de la sauvegarde du profil.");
    } finally {
      setIsLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      photoURL: user?.photoURL || "",
    });
    setPreviewImage(user?.photoURL || null);
    setSelectedFile(null);
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Retour"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Mon Profil</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading || isUploadingImage}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
              isLoading || isUploadingImage
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isLoading || isUploadingImage ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isUploadingImage
              ? "Upload en cours..."
              : isLoading
                ? "Sauvegarde..."
                : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
          {/* Photo de profil */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={!isUploadingImage ? handleImageClick : undefined}
              className={`relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 transition-opacity group ${
                isUploadingImage
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:opacity-75"
              }`}
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Photo de profil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
              {isUploadingImage ? (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-2">
              {isUploadingImage
                ? "Upload en cours..."
                : "Cliquez pour changer la photo"}
            </p>
            {selectedFile && !isUploadingImage && (
              <p className="text-xs text-blue-600 mt-1">
                Nouvelle image sélectionnée: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            {/* Nom d'affichage */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom d'affichage *
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre nom d'affichage"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Biographie
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Parlez-nous de vous... (optionnel)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/200 caractères
              </p>
            </div>

            {/* Informations du compte */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Informations du compte
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Email :</span> {user?.email}
                </div>
                <div>
                  <span className="font-medium">Membre depuis :</span>{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                    : "Non disponible"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;

// noinspection SpellCheckingInspection

import React, { useState } from "react";
import { ArrowLeft, LogOut, Save, Settings, Trash2 } from "lucide-react";
import type { Room } from "../types/room.types";
import { RoomService } from "../services/room.service";
import { UserService } from "../services/user.service";
import { useAuth } from "../hooks/useAuth";

interface RoomSettingsProps {
  room: Room;
  onBack: () => void;
  onRoomUpdate: (room: Room) => void;
  onLeaveRoom?: () => void;
  onRoomDeleted?: () => void;
}

// Note: This component needs refactoring to use the new StickRoom model with memberIds
// Temporarily simplified to make build pass

const RoomSettings: React.FC<RoomSettingsProps> = ({
  room,
  onBack,
  onRoomUpdate,
  onLeaveRoom,
  onRoomDeleted,
}) => {
  const { user } = useAuth();
  const [description, setDescription] = useState(room.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isOwner = user && room.owner.uid === user.uid;

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Create updated room object
      const updatedRoom: Room = {
        ...room,
        description: description.trim(),
      };

      // Update room in Firebase
      await RoomService.updateRoomDetails(updatedRoom);

      onRoomUpdate(updatedRoom);
      onBack();
    } catch (error) {
      console.error("Error updating room:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !room.id) return;

    try {
      await UserService.removeRoomFromUser(user.uid, room.id);
      await RoomService.removeUserFromRoom(room.id, user.uid, user);
      onLeaveRoom?.();
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const confirmLeaveRoom = () => {
    setShowLeaveModal(false);
    handleLeaveRoom().catch((error) =>
      console.error("Failed to leave room:", error)
    );
  };

  const handleDeleteRoom = async () => {
    if (!user || !room.id || !isOwner) return;

    try {
      await RoomService.deleteRoom(room.id, user);
      onRoomDeleted?.();
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const confirmDeleteRoom = () => {
    setShowDeleteModal(false);
    handleDeleteRoom().catch((error) =>
      console.error("Failed to delete room:", error)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </button>
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-gray-600 mr-2" />
            <h1 className="text-xl font-semibold">Paramètres</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* StickRoom Info */}
          <div>
            <h2 className="text-lg font-medium mb-4">
              Informations de la room
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la room
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {room.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Description de la room"
                />
              </div>
            </div>
          </div>

          {/* Members Section - Placeholder */}
          <div>
            <h2 className="text-lg font-medium mb-4">Membres</h2>
            <div className="text-sm text-gray-500">
              Section de gestion des membres en cours de refactorisation...
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>

            {!isOwner && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Quitter la room
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la room
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quitter la room
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir quitter "{room.name}" ? Vous ne pourrez
                plus voir les items des autres membres.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmLeaveRoom}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Supprimer la room
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer "{room.name}" ? Cette action
                est irréversible et supprimera tous les items de tous les
                membres.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteRoom}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomSettings;

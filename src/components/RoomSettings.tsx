import React, { useState } from "react";
import { ArrowLeft, Settings, User, Plus, X, Save, FileText } from "lucide-react";
import type { Room, Player } from "../types/room.types";
import type { Stick } from "../types/stick.types";
import { RoomService } from "../services/room.service";

interface RoomSettingsProps {
  room: Room;
  onBack: () => void;
  onRoomUpdate: (updatedRoom: Room) => void;
}

interface PlayerEdit extends Player {
  isNew?: boolean;
}

const RoomSettings: React.FC<RoomSettingsProps> = ({
  room,
  onBack,
  onRoomUpdate,
}) => {
  const [description, setDescription] = useState(room.description || "");
  const [players, setPlayers] = useState<PlayerEdit[]>(
    room.players.map(p => ({ ...p }))
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // Check minimum players
    if (players.length < 2) {
      newErrors.players = "Il faut au moins 2 joueurs";
    }
    
    // Check maximum players
    if (players.length > 8) {
      newErrors.players = "Maximum 8 joueurs autorisés";
    }
    
    // Check for empty names
    players.forEach((player, index) => {
      if (!player.name.trim()) {
        newErrors[`player${index}`] = "Le nom ne peut pas être vide";
      }
    });
    
    // Check for duplicate names
    const names = players.map(p => p.name.trim().toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      players.forEach((player, index) => {
        if (duplicates.includes(player.name.trim().toLowerCase())) {
          newErrors[`player${index}`] = "Ce nom est déjà utilisé";
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlayerNameChange = (index: number, newName: string) => {
    setPlayers(prev => prev.map((player, i) => 
      i === index ? { ...player, name: newName } : player
    ));
    
    // Clear error for this player
    const errorKey = `player${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: "" }));
    }
  };

  const addPlayer = () => {
    if (players.length < 8) {
      const newPlayer: PlayerEdit = {
        id: `player_${Date.now()}`, // Temporary ID
        name: "",
        sticks: [],
        isNew: true
      };
      setPlayers(prev => [...prev, newPlayer]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(prev => prev.filter((_, i) => i !== index));
      
      // Clear any error for removed player
      const errorKey = `player${index}`;
      if (errors[errorKey]) {
        setErrors(prev => ({ ...prev, [errorKey]: "" }));
      }
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Create updated room object
      const updatedRoom: Room = {
        ...room,
        description: description.trim(),
        players: players.map(player => ({
          id: player.isNew ? `player_${Date.now()}_${Math.random()}` : player.id,
          name: player.name.trim(),
          sticks: player.sticks || []
        })),
        updatedAt: new Date().toISOString()
      };
      
      // Update room in Firebase
      await RoomService.updateRoomDetails(updatedRoom);
      
      onRoomUpdate(updatedRoom);
      onBack();
    } catch (error) {
      console.error("Error updating room:", error);
      setErrors({ general: "Erreur lors de la sauvegarde" });
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalSticks = (playerSticks: Stick[]): number => {
    return playerSticks.reduce((total, stick) => {
      return stick.isRemoved ? total - stick.count : total + stick.count;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>
        </div>
        <h1 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <Settings size={20} />
          <span>Paramètres - {room.name}</span>
        </h1>
        <div /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Room Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-2" />
                Description du salon
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description optionnelle..."
                rows={3}
              />
            </div>

            {/* Players Management */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  <User size={16} className="inline mr-2" />
                  Joueurs ({players.length})
                </label>
                {players.length < 8 && (
                  <button
                    onClick={addPlayer}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                  >
                    <Plus size={14} />
                    <span>Ajouter</span>
                  </button>
                )}
              </div>

              {errors.players && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{errors.players}</p>
                </div>
              )}

              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={player.name}
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
                    
                    {!player.isNew && (
                      <div className="text-sm text-gray-600">
                        {getTotalSticks(player.sticks)} bâtons
                      </div>
                    )}
                    
                    {players.length > 2 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Supprimer ce joueur"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-500">
                • Minimum 2 joueurs, maximum 8 joueurs
                • La suppression d'un joueur supprimera définitivement son historique de bâtons
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors flex items-center justify-center space-x-2 ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Save size={16} />
                <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSettings;
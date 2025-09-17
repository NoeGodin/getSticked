import React, { useState } from "react";
import { ArrowLeft, Settings, User, Plus, X, Save, FileText, LogOut, Trash2 } from "lucide-react";
import type { Room, Player } from "../types/room.types";
import type { Stick } from "../types/stick.types";
import { RoomService } from "../services/room.service";
import { UserService } from "../services/user.service";
import { useAuth } from "../contexts/AuthContext";

interface RoomSettingsProps {
  room: Room;
  onBack: () => void;
  onRoomUpdate: (updatedRoom: Room) => void;
  onLeaveRoom?: () => void;
  onRoomDeleted?: () => void;
}

interface PlayerEdit extends Player {
  isNew?: boolean;
}

const RoomSettings: React.FC<RoomSettingsProps> = ({
  room,
  onBack,
  onRoomUpdate,
  onLeaveRoom,
  onRoomDeleted,
}) => {
  const { user } = useAuth();
  const [description, setDescription] = useState(room.description || "");
  const [players, setPlayers] = useState<PlayerEdit[]>(
    room.players.map(p => ({ ...p }))
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOwner = user && room.owner.uid === user.uid;

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

  const handleLeaveRoom = async () => {
    if (!user || !room.id) return;

    try {
      // Remove room from user's joined rooms
      await UserService.removeRoomFromUser(user.uid, room.id);
      
      setShowLeaveConfirmation(false);
      if (onLeaveRoom) {
        onLeaveRoom();
      } else {
        onBack();
      }
    } catch (error) {
      console.error("Error leaving room:", error);
      setErrors({ general: "Erreur lors de la sortie du salon" });
      setShowLeaveConfirmation(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!user || !room.id || isDeleting) return;

    setIsDeleting(true);
    try {
      await RoomService.deleteRoom(room.id, user);
      setShowDeleteConfirmation(false);
      
      if (onRoomDeleted) {
        onRoomDeleted();
      } else {
        onBack();
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      setErrors({ general: "Erreur lors de la suppression du salon" });
    } finally {
      setIsDeleting(false);
    }
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

            {/* Danger Zone */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Zone de danger</h3>
              <div className="space-y-4">
                {/* Leave Room - Only for non-owners */}
                {!isOwner && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <LogOut size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          Quitter ce salon
                        </h4>
                        <p className="text-sm text-red-600 mb-3">
                          Vous ne recevrez plus de notifications et devrez rejoindre à nouveau avec le nom et la clé secrète.
                        </p>
                        <button
                          onClick={() => setShowLeaveConfirmation(true)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
                        >
                          <LogOut size={14} />
                          <span>Quitter le salon</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Room - Only for owners */}
                {isOwner && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <Trash2 size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          Supprimer définitivement ce salon
                        </h4>
                        <p className="text-sm text-red-600 mb-3">
                          Cette action est irréversible. Toutes les données du salon et l'historique seront perdus définitivement.
                        </p>
                        <button
                          onClick={() => setShowDeleteConfirmation(true)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
                        >
                          <Trash2 size={14} />
                          <span>Supprimer le salon</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <LogOut size={24} className="text-red-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Quitter le salon
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir quitter le salon "<strong>{room.name}</strong>" ? 
              Cette action supprimera le salon de votre liste et vous devrez le rejoindre 
              à nouveau avec le nom et la clé secrète.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaveConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleLeaveRoom}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut size={16} />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Supprimer le salon
                </h3>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4 p-3 bg-red-50 rounded-lg">
                  <Trash2 size={20} className="text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Action irréversible
                    </p>
                    <p className="text-xs text-red-600">
                      Toutes les données seront perdues définitivement
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir supprimer le salon <strong>"{room.name}"</strong> ? 
                  Cette action supprimera :
                </p>
                
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                  <li>Tous les joueurs et leurs scores</li>
                  <li>L'historique complet des bâtons</li>
                  <li>Toutes les données du salon</li>
                </ul>
              </div>
              
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {errors.general}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteRoom}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? "Suppression..." : "Supprimer définitivement"}</span>
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
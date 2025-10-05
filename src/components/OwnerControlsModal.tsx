import React, { useState } from "react";
import { Shield, Edit3, UserX, X } from "lucide-react";
import type { ItemOption, ItemType } from "../types/item-type.types";
import type { Player } from "../types/room.types";

interface OwnerControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  itemType: ItemType;
  onScoreChange: (optionId: string, newScore: number) => Promise<void>;
  onKickPlayer: () => Promise<void>;
  currentUserId: string;
}

const OwnerControlsModal: React.FC<OwnerControlsModalProps> = ({
  isOpen,
  onClose,
  player,
  itemType,
  onScoreChange,
  onKickPlayer,
  currentUserId,
}) => {
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [newScore, setNewScore] = useState<number>(0);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Calculate current scores for each option
  const getCurrentScore = (optionId: string): number => {
    return player.items
      .filter((item) => item.optionId === optionId && !item.isRemoved)
      .reduce((sum, item) => sum + (item.count || 1), 0);
  };

  const handleEditScore = (option: ItemOption) => {
    const currentScore = getCurrentScore(option.id);
    setNewScore(currentScore);
    setEditingOption(option.id);
  };

  const handleSaveScore = async () => {
    if (!editingOption) return;

    setLoading(true);
    try {
      await onScoreChange(editingOption, newScore);
      setEditingOption(null);
    } catch (error) {
      console.error("Error updating score:", error);
      alert("Erreur lors de la modification du score");
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async () => {
    setLoading(true);
    try {
      await onKickPlayer();
      onClose();
    } catch (error) {
      console.error("Error kicking player:", error);
      alert("Erreur lors de l'exclusion du joueur");
    } finally {
      setLoading(false);
    }
  };

  const canKick = player.id !== currentUserId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Contrôles Propriétaire
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Gérer les scores et l'accès de {player.name}
          </p>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Score Management */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Edit3 size={16} />
              Modifier les scores
            </h4>
            <div className="space-y-3">
              {itemType.options.map((option) => {
                const currentScore = getCurrentScore(option.id);
                const isEditing = editingOption === option.id;

                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{option.emoji}</span>
                      <div>
                        <span className="font-medium">{option.name}</span>
                        <div className="text-xs text-gray-500">
                          {option.points} pts chacun
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={newScore}
                            onChange={(e) =>
                              setNewScore(parseInt(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveScore}
                            disabled={loading}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingOption(null)}
                            className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">
                            {currentScore}
                          </span>
                          <button
                            onClick={() => handleEditScore(option)}
                            className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            title="Modifier le score"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kick Player */}
          {canKick && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <UserX size={16} />
                Exclusion du joueur
              </h4>

              {!showKickConfirm ? (
                <button
                  onClick={() => setShowKickConfirm(true)}
                  className="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Exclure {player.name} de la room
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Attention :</strong> Cette action est
                      irréversible.
                      {player.name} sera retiré de la room et perdra l'accès à
                      ses données.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleKick}
                      disabled={loading}
                      className="flex-1 p-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50"
                    >
                      {loading ? "Exclusion..." : "Confirmer l'exclusion"}
                    </button>
                    <button
                      onClick={() => setShowKickConfirm(false)}
                      className="flex-1 p-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerControlsModal;

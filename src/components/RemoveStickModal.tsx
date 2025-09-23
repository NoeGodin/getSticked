import React, { useEffect, useState } from "react";
import { Minus, X } from "lucide-react";

interface RemoveStickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  stickCount: number;
  playerName: string;
}

const RemoveStickModal: React.FC<RemoveStickModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stickCount,
  playerName,
}) => {
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset comment when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setComment("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onConfirm(comment.trim());
      onClose();
    } catch (error) {
      console.error("Error removing sticks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Retirer des bâtons
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
                <Minus size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {stickCount === 1
                  ? `Retirer 1 bâton pour ${playerName}`
                  : `Retirer ${stickCount} bâtons pour ${playerName}`}
              </h3>
              <p className="text-sm text-gray-600">
                Ajoutez un commentaire pour expliquer cette suppression
                (optionnel)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
                placeholder="Pourquoi retirez-vous ces bâtons ?"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {comment.length}/200
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Minus size={16} className="mr-2" />
                  Retirer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemoveStickModal;

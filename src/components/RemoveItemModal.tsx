import React, { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { ItemOption } from "../types/item-type.types";

interface RemoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number, comment: string) => void;
  option: ItemOption;
  maxCount: number; // Maximum items available to remove
}

const RemoveItemModal: React.FC<RemoveItemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  option,
  maxCount,
}) => {
  const [count, setCount] = useState(1);
  const [comment, setComment] = useState("");

  const handleConfirm = () => {
    onConfirm(count, comment);
    // Reset for next time
    setCount(1);
    setComment("");
    onClose();
  };

  const handleCancel = () => {
    setCount(1);
    setComment("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">{option.emoji}</span>
            Retirer {option.name}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Available count info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              Vous avez <span className="font-bold">{maxCount}</span>{" "}
              {option.name.toLowerCase()}
              {maxCount > 1 ? "s" : ""} disponible{maxCount > 1 ? "s" : ""}
            </p>
          </div>

          {/* Quantity selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité à retirer
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCount(Math.max(1, count - 1))}
                className="flex items-center justify-center w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              >
                <Minus size={16} />
              </button>

              <span className="text-xl font-bold text-gray-800 min-w-[3rem] text-center">
                {count}
              </span>

              <button
                onClick={() => setCount(Math.min(maxCount, count + 1))}
                className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-sm text-gray-500 mt-2">
              Retrait: {count} × {option.points} = -{count * option.points}{" "}
              points
            </div>
          </div>

          {/* Comment input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du retrait (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Pourquoi retirer ce ${option.name.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/200 caractères
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Minus size={16} />
            Retirer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveItemModal;

import React from "react";
import { Calendar, MessageSquare, X } from "lucide-react";
import type { StickLogProps } from "../types/ui.types";

const StickLog: React.FC<StickLogProps> = ({
  isOpen,
  onClose,
  playerName,
  sticks,
}) => {
  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalSticks = sticks.reduce((sum, stick) => sum + stick.count, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Historique - {playerName}
              </h2>
              <p className="text-gray-600">
                Total: {totalSticks} bâton{totalSticks > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Fermer"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {sticks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-lg">Aucun bâton enregistré</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sticks
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((stick, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Stick count badge */}
                          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold min-w-12 text-center">
                            {stick.count}
                          </div>

                          {/* Comment */}
                          <div className="flex-1">
                            {stick.comment ? (
                              <p className="text-gray-800 text-sm leading-relaxed">
                                {stick.comment}
                              </p>
                            ) : (
                              <p className="text-gray-400 text-sm italic">
                                Aucun commentaire
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center text-xs text-gray-500 ml-4">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(stick.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StickLog;

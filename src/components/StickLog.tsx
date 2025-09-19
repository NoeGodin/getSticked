import React, { useState } from "react";
import {
  Calendar,
  Eye,
  EyeOff,
  MessageSquare,
  Minus,
  Plus,
  X,
} from "lucide-react";
import type { StickLogProps } from "../types/ui.types";
import { formatDate, getTotalSticks } from "../utils/helpers.ts";

const StickLog: React.FC<StickLogProps> = ({
  isOpen,
  onClose,
  playerName,
  sticks,
}) => {
  const [showRemovedSticks, setShowRemovedSticks] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalSticks = getTotalSticks(sticks);
  const hasRemovedSticks = sticks.some((stick) => stick.isRemoved);

  const filteredSticks = showRemovedSticks
    ? sticks
    : sticks.filter((stick) => !stick.isRemoved);

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
            <div className="flex items-center space-x-4">
              {/* Toggle for showing removed sticks - only if there are removed sticks */}
              {hasRemovedSticks && (
                <div className="flex items-center space-x-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRemovedSticks}
                      onChange={(e) => setShowRemovedSticks(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                        showRemovedSticks ? "bg-red-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                          showRemovedSticks ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                    <span className="ml-2 text-xs sm:text-sm text-gray-600 flex items-center">
                      {showRemovedSticks ? (
                        <>
                          <EyeOff size={14} className="mr-1 hidden sm:block" />
                          <span className="hidden sm:inline">Masquer suppressions</span>
                          <span className="sm:hidden">Masquer</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} className="mr-1 hidden sm:block" />
                          <span className="hidden sm:inline">Voir suppressions</span>
                          <span className="sm:hidden">Suppressions</span>
                        </>
                      )}
                    </span>
                  </label>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Fermer"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredSticks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p className="text-lg">
                  {showRemovedSticks
                    ? "Aucun bâton ou suppression enregistrés"
                    : "Aucun bâton enregistré"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSticks
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((stick, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border hover:shadow-md transition-shadow duration-200 ${
                        stick.isRemoved
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Action icon and count badge */}
                          <div className="flex items-center space-x-2">
                            {stick.isRemoved ? (
                              <Minus size={16} className="text-red-600" />
                            ) : (
                              <Plus size={16} className="text-blue-600" />
                            )}
                            <div
                              className={`text-white px-3 py-1 rounded-full text-sm font-semibold min-w-12 text-center ${
                                stick.isRemoved ? "bg-red-500" : "bg-blue-500"
                              }`}
                            >
                              {stick.count}
                            </div>
                          </div>

                          {/* Comment */}
                          <div className="flex-1">
                            {stick.comment.trim() ? (
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
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {showRemovedSticks && (
                  <span className="flex items-center">
                    <Plus size={14} className="text-blue-600 mr-1" />
                    Ajouts •
                    <Minus size={14} className="text-red-600 mx-1" />
                    Suppressions
                  </span>
                )}
              </div>
            </div>
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

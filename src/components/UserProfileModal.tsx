import React from "react";
import { Calendar, User as UserIcon, X } from "lucide-react";
import Avatar from "./Avatar";
import type { AuthUser } from "../types/auth.types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {user.displayName ? (
                      <span className="text-2xl font-semibold text-gray-600">
                        {user.displayName
                          .trim()
                          .split(" ")
                          .map(word => word.charAt(0))
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                    ) : (
                      <UserIcon size={48} className="text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user.displayName}
            </h2>
          </div>

          <div className="space-y-4">
            {user.bio && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Bio</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Membre depuis
                </span>
              </div>
              <p className="text-gray-700">{formatDate(user.createdAt)}</p>
            </div>

            {user.joinedRooms && user.joinedRooms.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Rooms rejointes
                  </span>
                </div>
                <p className="text-blue-700 font-medium">
                  {user.joinedRooms.length}{" "}
                  {user.joinedRooms.length === 1 ? "room" : "rooms"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

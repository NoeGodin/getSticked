import React from "react";
import { Plus, X, User } from "lucide-react";

interface PlayerManagerProps {
  players: string[];
  onPlayersChange: (players: string[]) => void;
  errors?: { [key: string]: string };
  onErrorClear?: (key: string) => void;
  minPlayers?: number;
  maxPlayers?: number;
  readonly?: boolean;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  onPlayersChange,
  errors = {},
  onErrorClear,
  minPlayers = 2,
  maxPlayers = 8,
  readonly = false
}) => {
  const handlePlayerNameChange = (index: number, value: string) => {
    const newPlayers = players.map((name, i) => i === index ? value : name);
    onPlayersChange(newPlayers);
    
    // Clear error when user starts typing
    const errorKey = `player${index}`;
    if (errors[errorKey] && onErrorClear) {
      onErrorClear(errorKey);
    }
  };

  const addPlayer = () => {
    if (players.length < maxPlayers) {
      onPlayersChange([...players, ""]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > minPlayers) {
      const newPlayers = players.filter((_, i) => i !== index);
      onPlayersChange(newPlayers);
      
      // Clear error for this player
      const errorKey = `player${index}`;
      if (errors[errorKey] && onErrorClear) {
        onErrorClear(errorKey);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          <User size={16} className="inline mr-2" />
          Joueurs ({players.length}/{maxPlayers})
        </label>
        {!readonly && players.length < maxPlayers && (
          <button
            type="button"
            onClick={addPlayer}
            className="flex items-center space-x-1 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors"
          >
            <Plus size={14} />
            <span>Ajouter</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={player}
              onChange={(e) => handlePlayerNameChange(index, e.target.value)}
              disabled={readonly}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`player${index}`] ? "border-red-500" : "border-gray-300"
              } ${readonly ? "bg-gray-50" : ""}`}
              placeholder={`Joueur ${index + 1}`}
            />
            {!readonly && players.length > minPlayers && (
              <button
                type="button"
                onClick={() => removePlayer(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.players && (
        <p className="mt-2 text-sm text-red-600">{errors.players}</p>
      )}

      {/* Show validation errors for individual players */}
      {players.map((_, index) => {
        const errorKey = `player${index}`;
        return errors[errorKey] ? (
          <p key={errorKey} className="mt-1 text-sm text-red-600">
            Joueur {index + 1}: {errors[errorKey]}
          </p>
        ) : null;
      })}
    </div>
  );
};

export default PlayerManager;
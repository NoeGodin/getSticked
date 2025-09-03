import React from "react";
import StickCounter from "../components/StickCounter";
import type { Stick } from "../types/stick.types";

interface DualStickCounterProps {
  player1Name?: string;
  player2Name?: string;
  player1Sticks?: Stick[];
  player2Sticks?: Stick[];
}

const DualStickCounter: React.FC<DualStickCounterProps> = ({
  player1Name = "Joueur 1",
  player2Name = "Joueur 2",
  player1Sticks = [],
  player2Sticks = [],
}) => {
  return (
    <div className="h-screen flex bg-gray-100">
      {/* Player 1 */}
      <div className="flex-1 border-r border-gray-300">
        <StickCounter playerName={player1Name} sticks={player1Sticks} />
      </div>

      {/* Player 2 */}
      <div className="flex-1">
        <StickCounter playerName={player2Name} sticks={player2Sticks} />
      </div>
    </div>
  );
};

export default DualStickCounter;

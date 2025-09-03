import React from "react";
import StickCounter from "./StickCounter.tsx";
import type { Stick } from "../types/stick.types.ts";

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
    <div className="min-h-dvh flex items-center justify-center bg-gray-100">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-6xl p-2 sm:p-4">
        {/* Player 1 */}
        <StickCounter playerName={player1Name} sticks={player1Sticks} />

        {/* Player 2 */}
        <StickCounter playerName={player2Name} sticks={player2Sticks} />
      </div>
    </div>
  );
};

export default DualStickCounter;

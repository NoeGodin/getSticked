import DualStickCounter from "./pages/DualStickCounter";
import { mockStickCounterProps } from "./data/ui.data";

function App() {
  return (
    <>
      <DualStickCounter
        player1Name={mockStickCounterProps[0]?.playerName || "Joueur 1"}
        player1Sticks={mockStickCounterProps[0]?.sticks || []}
        player2Name={mockStickCounterProps[1]?.playerName || "Joueur 2"}
        player2Sticks={mockStickCounterProps[1]?.sticks || []}
      />
    </>
  );
}

export default App;

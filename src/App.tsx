import StickCounter from "./components/StickCounter.tsx";
import { mockStickCounterProps } from "./data/ui.data.ts";

function App() {
  return (
    <>
      <StickCounter
        playerName={mockStickCounterProps[0].playerName}
        sticks={mockStickCounterProps[0].sticks}
      />
    </>
  );
}

export default App;

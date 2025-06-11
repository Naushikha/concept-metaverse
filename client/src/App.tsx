import { useState } from "react";
import Game from "./components/Game";
import { connectToRoom } from "./utils/connection";

function App() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("#00ff00");

  const joinRoom = async () => {
    await connectToRoom(username, color);
    setJoined(true);
  };

  return joined ? (
    <Game />
  ) : (
    <div className="join-screen">
      <h1>Join Game</h1>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="color"
        value={color}
        style={{ width: "100px", height: "40px" }}
        onChange={(e) => setColor(e.target.value)}
      />
      <button onClick={joinRoom}>Join</button>
    </div>
  );
}

export default App;

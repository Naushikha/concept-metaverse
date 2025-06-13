import { useState } from "react";
import Game from "./components/Game";
import { connectToRoom } from "./utils/connection";

function App() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("#00ff00");
  const [skin, setSkin] = useState("default-male");

  const joinRoom = async () => {
    await connectToRoom(username, color, skin);
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
      <select
        onChange={(e) => setSkin(e.target.value)}
        value={skin}
        style={{ width: "100px", height: "40px" }}
      >
        <option value="default-male">Default Male</option>
        <option value="default-female">Default Female</option>
        <option value="spiderman">Spiderman</option>
      </select>
      <button onClick={joinRoom}>Join</button>
    </div>
  );
}

export default App;

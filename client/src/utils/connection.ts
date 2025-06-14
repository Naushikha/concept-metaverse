import { Client, getStateCallbacks, Room } from "colyseus.js";
import { useGameStore } from "./store";

export const client = new Client("ws://localhost:2567");

export async function connectToRoom(
  username: string,
  color: string,
  skin: string
) {
  const room: Room = await client.joinOrCreate<Room>("my_room", {
    username,
    color,
    skin,
  });
  const setRoom = useGameStore.getState().setRoom;
  setRoom(room);
  console.log("Connected to room:", room.sessionId);
  const setMyId = useGameStore.getState().setMyId;
  const updatePlayers = useGameStore.getState().updatePlayers;

  const $ = getStateCallbacks(room);

  setMyId(room.sessionId);

  $(room.state).players.onAdd((player, sessionId) => {
    updatePlayers({
      ...useGameStore.getState().players,
      [sessionId]: {
        id: sessionId,
        username: player.username,
        color: player.color,
        skin: player.skin,
        state: player.state,
        position: [player.x, player.y, player.z],
        rotationY: player.rotationY,
      },
    });

    // Listen for changes to the player object
    $(player).onChange(() => {
      const isSelf = sessionId === room.sessionId;
      const currentPlayers = useGameStore.getState().players;

      updatePlayers({
        ...currentPlayers,
        [sessionId]: {
          id: sessionId,
          username: player.username,
          color: player.color,
          skin: player.skin,
          state: isSelf ? currentPlayers[sessionId]?.state : player.state,
          position: [player.x, player.y, player.z],
          rotationY: player.rotationY,
        },
      });
    });
  });

  $(room.state).players.onRemove((_, sessionId) => {
    const players = useGameStore.getState().players;
    delete players[sessionId];
    updatePlayers(players);
  });

  return room;
}

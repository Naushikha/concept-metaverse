// client/src/store.ts
import type { Room } from "colyseus.js";
import { create } from "zustand";

export interface Player {
  id: string;
  username: string;
  color: string;
  state: string; // e.g., "Idle", "Running", "Jumping"
  skin: string;
  position: [number, number, number];
  rotationY: number;
}

interface GameState {
  myId: string;
  room: Room;
  players: Record<string, Player>;
  setMyId: (id: string) => void;
  updatePlayers: (players: Record<string, Player>) => void;
  setRoom: (room: Room) => void;
}

export const useGameStore = create<GameState>((set) => ({
  myId: "",
  room: null as unknown as Room,
  players: {},
  setMyId: (id) => set({ myId: id }),
  updatePlayers: (players) => set({ players }),
  setRoom: (room) => set({ room }),
}));

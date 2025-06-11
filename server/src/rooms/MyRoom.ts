// import { Room, Client } from "@colyseus/core";
// import { MyRoomState } from "./schema/MyRoomState";

// export class MyRoom extends Room<MyRoomState> {
//   maxClients = 4;
//   state = new MyRoomState();

//   onCreate (options: any) {
//     this.onMessage("type", (client, message) => {
//       //
//       // handle "type" message
//       //
//     });
//   }

//   onJoin (client: Client, options: any) {
//     console.log(client.sessionId, "joined!");
//   }

//   onLeave (client: Client, consented: boolean) {
//     console.log(client.sessionId, "left!");
//   }

//   onDispose() {
//     console.log("room", this.roomId, "disposing...");
//   }

// }

import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4; // Or whatever limit you want

  onCreate() {
    this.state = new MyRoomState(); // Initialize the state
    console.log("Room created:", this.roomId);

    // Set up message listeners
    this.onMessage(
      "move",
      (
        client,
        data: { x: number; y: number; z: number; rotationY: number }
      ) => {
        const player = this.state.players.get(client.sessionId);
        if (player) {
          player.x = data.x;
          player.y = data.y;
          player.z = data.z;
          player.rotationY = data.rotationY;
          // Colyseus automatically synchronizes changes to schema properties
        }
      }
    );

    this.onMessage("rotate", (client, data: { rotationY: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.rotationY = data.rotationY;
        // Colyseus automatically synchronizes changes to schema properties
      }
    });

    // this.onMessage(
    //   "playerJoined",
    //   (client, data: { username: string; color: string }) => {
    //     let player = this.state.players.get(client.sessionId);
    //     if (player) {
    //       player.username = data.username;
    //       player.color = data.color;
    //     } else {
    //       console.warn(
    //         `Player ${client.sessionId} sent playerJoined but not found.`
    //       );
    //     }
    //   }
    // );
  }

  onJoin(client: Client, options: { username: string; color: string }) {
    console.log(`${options.username} [id:${client.sessionId}] joined!`);

    const player = new Player();
    player.id = client.sessionId;
    player.username = options.username;
    player.color = options.color;
    player.x = Math.random() * 5 - 2.5; // Initial random position
    player.y = 0; // Ground level
    player.z = Math.random() * 5 - 2.5;
    player.rotationY = 0;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(
      `${this.state.players.get(client.sessionId).username} [id:${
        client.sessionId
      }] left!`
    );

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("Room disposed:", this.roomId);
  }
}

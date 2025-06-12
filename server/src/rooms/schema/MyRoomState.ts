import { MapSchema, Schema, type } from "@colyseus/schema";

// export class MyRoomState extends Schema {

//   @type("string") mySynchronizedProperty: string = "Hello world";

// }

export class Player extends Schema {
  @type("string") id!: string;
  @type("string") username!: string;
  @type("string") skin!: string; // Player skin
  @type("string") color!: string; // Hex color string, e.g., "#RRGGBB"
  @type("string") state!: string; // State, e.g., "Idle", "Running", "Jumping"
  @type("number") x!: number;
  @type("number") y!: number; // For 2D plane in Colyseus, or z for 3D
  @type("number") z!: number; // For 3D
  @type("number") rotationY!: number; // For horizontal rotation
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

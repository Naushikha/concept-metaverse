// /**
//  * IMPORTANT:
//  * ---------
//  * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
//  *
//  * If you're self-hosting (without Colyseus Cloud), you can manually
//  * instantiate a Colyseus Server as documented here:
//  *
//  * See: https://docs.colyseus.io/server/api/#constructor-options
//  */
// import { listen } from "@colyseus/tools";

// // Import Colyseus config
// import app from "./app.config";

// // Create and listen on 2567 (or PORT environment variable.)
// listen(app);

// CUSTOM CODE WITH CORS SUPPORT

import express from "express";
import { createServer } from "http";
import { matchMaker, Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { MyRoom } from "./rooms/MyRoom";

const app = express();
app.use(express.json());
const allowedOrigins = ["http://localhost:5173", "https://bxpe.lunarxr.com"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

matchMaker.controller.getCorsHeaders = function (req) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin))
    return {
      "Access-Control-Allow-Origin": origin, // Match the allowed origin
      "Access-Control-Allow-Credentials": "true", // Allow credentials
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
};

if (process.env.NODE_ENV !== "production") {
  app.use("/", playground());
}
app.use("/monitor", monitor());

const gameServer = new Server({
  server: createServer(app),
});

gameServer.listen(2567);

gameServer.define("my_room", MyRoom);

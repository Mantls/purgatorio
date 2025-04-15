import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { DanteRelayPayload } from "./client.js";
import { parse } from "node:path";

const PORT = parseInt(process.env["PORT"] ?? "8080");
const wss = new WebSocketServer({ port: PORT });
const connections: Map<string, WebSocket> = new Map();

console.log(`Starting WebSocketServer on: ${JSON.stringify(wss.address())}`);

wss.on("connection", (ws) => {
  const id = randomUUID();
  connections.set(id, ws);
  console.log(`Opened Websocket Connection ${id}`);

  ws.on("message", (msg) => {
    const parsed: DanteRelayPayload = JSON.parse(msg.toString());
    console.log(parsed.payload.toString());
    for (const [con_id, con] of connections) {
      if (id == con_id) continue; // dont mirror
      con.send(msg);
    }
    ws.on("error", (err) => {
      console.log(`[${id}]: ${err.name}:${err.message}; Closing connection.`);
      ws.close();
    });
  });

  ws.on("close", () => {
    console.log(`closed connection ${id}`);
    connections.delete(id);
  });
});

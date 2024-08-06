import dgram from "node:dgram";
import { z } from "zod";
import { WebSocket } from "ws";
import { randomInt } from "node:crypto";

export type DanteRelayPayload = {
  dst_addr: string;
  dst_port: number;
  payload: Buffer;
};

async function main() {
  const interface_ip = z.string().ip().parse(process.env["INTERFACE_ADDRESS"]);
  const mcast = z.string().ip().parse(process.env["MCAST_ADDRESS"]);
  const port = parseInt(process.env["PORT"]!);
  const server = new URL(z.string().url().parse(process.env["SERVER_ADDR"]));
  const ws = new WebSocket(server);

  ws.on("open", () => {
    console.log(`Opened WebSocket to ${ws.url}`);
  });
  ws.on("message", (msg) => {
    const parsed: DanteRelayPayload = JSON.parse(msg.toString());
    send_client.send(JSON.stringify(parsed), parsed.dst_port, parsed.dst_addr);
  });
  ws.on("error", (err) => {
    console.log(`${err.name}:${err.message}; Closing connection.`);
    ws.close();
  });
  ws.on("close", () => {
    console.log(`Lost connection to ${server.toString()}; exiting`); // we'll just crash on connection-loss and restart the process on a higher layer
    process.exit(1);
  });

  const send_client = dgram.createSocket("udp4");
  send_client.on("listening", function() {
    const addr = send_client.address();
    console.log(`Start listening on ${addr.address}:${addr.port}`);
    send_client.setMulticastTTL(1);
    send_client.setBroadcast(true);
    send_client.setMulticastInterface(interface_ip);
  });
  send_client.bind(randomInt(port + 1, 2 << 16), interface_ip);

  const listen_client = dgram.createSocket("udp4");
  listen_client.on("listening", function() {
    const addr = listen_client.address();
    console.log(`Start listening on ${addr.address}:${addr.port}`);
    listen_client.setMulticastTTL(1);
    listen_client.setBroadcast(true);
    listen_client.addMembership(mcast);
    listen_client.setMulticastInterface(interface_ip);
  });

  listen_client.on("message", function(message, remote) {
    console.log(`${remote.address}:${remote.port} => ${message.toString()}`);
    const relay_payload: DanteRelayPayload = {
      dst_addr: mcast,
      dst_port: port,
      payload: message,
    };
    ws.send(JSON.stringify(relay_payload));
  });
  listen_client.bind(port);
}
main();

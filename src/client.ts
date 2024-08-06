import dgram from "node:dgram";
import { z } from "zod";
import { WebSocket } from "ws";
import { randomInt } from "node:crypto";

export type DanteRelayPayload = {
  dst_addr: string;
  dst_port: number;
  payload: Buffer;
};

const interface_ip = z.string().ip().parse(process.env["INTERFACE_ADDRESS"]);
const server = new URL(z.string().url().parse(process.env["SERVER_ADDR"]));
const ws = new WebSocket(server);

const targets = z
  .array(
    z
      .string()
      .regex(/([\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}):([\d]{1,5})/),
  )
  .parse(process.env["TARGETS"]?.split(",").map((s) => s.trim()))
  .map((s) => {
    return [s.split(":")[0], s.split(":")[1]];
  });

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

const send_client = dgram.createSocket({ type: "udp4", reuseAddr: true });
send_client.on("listening", function () {
  const addr = send_client.address();
  console.log(`Start listening on ${addr.address}:${addr.port}`);
  send_client.setMulticastTTL(1);
  send_client.setBroadcast(true);
  send_client.setMulticastInterface(interface_ip);
});
send_client.bind(randomInt(6000, 2 << 16), interface_ip);

for (const [ip, port] of targets) {
  const port_num = parseInt(port);
  const listen_client = dgram.createSocket({ type: "udp4", reuseAddr: true });
  listen_client.on("listening", function () {
    const addr = listen_client.address();
    console.log(
      `Start listening on ${addr.address}:${addr.port} for multicast: ${ip}`,
    );
    listen_client.setMulticastTTL(1);
    listen_client.setBroadcast(true);
    listen_client.addMembership(ip);
    listen_client.setMulticastInterface(interface_ip);
  });

  listen_client.on("message", function (message, remote) {
    console.log(`${remote.address}:${remote.port} => ${message.toString()}`);
    const relay_payload: DanteRelayPayload = {
      dst_addr: ip,
      dst_port: port_num,
      payload: message,
    };
    ws.send(JSON.stringify(relay_payload));
  });
  listen_client.bind(port_num, interface_ip);
}

# What is this?

purgatorio is a small, lightweight service to distribute Multicast control and monitoring messages between subnets.

## Usage

### Server

The server simply distributes messages it receivers to all clients except the one it received from.
Simply specifiy the `PORT` environment Variable or leave it untouched to use it's default of 8080.

### Client

The client listens for a specified set of multicast-addresses and redistributes them to other clients via the server.
Simultaneously it redistributes received Multicast messages from other clients that it receives from the server.

_NOTE_ do not put more than one client on a subnet as this might lead to message loops.


The Client is configured via a handful of environment Variables

- `INTERFACE_ADDRESS` specifies the ip-address on which it listens for multicast
- `SERVER_ADDR` specifies the URL of the distribution-server.
- `TARGETS` is a comma seperated list of multicast-addresses and ports for which the client listens

For Example:

```bash
TARGETS="225.0.1.1:5004,225.0.1.2:5004" INTERFACE_ADDRESS="172.16.220.13" SERVER_ADDR="ws://127.0.0.1:8080" node build/client.js
```

## Docker 

Pre-Built Images (linux/amd64) for both Client and Server can be found here:

- [Client](https://hub.docker.com/r/jonasreucher/purgatorio-client)
- [Server](https://hub.docker.com/r/jonasreucher/purgatorio-server)

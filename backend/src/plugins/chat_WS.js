import fp from "fastify-plugin";
import { getOrCreateConversation } from "./conversationService.js";
import sqlite3pkg from "sqlite3";
import { promisify } from "util";

const sqlite3 = sqlite3pkg.verbose();
const db = new sqlite3.Database("./data/users.sqlite3");

export default fp(async function (fastify) {
  // --- Global Chat ---
  const clients = new Set();

  fastify.get("/chat", { websocket: true }, (socket, req) => {
    clients.add(socket);

    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (err) {
        console.error("[CHAT] Invalid JSON:", err);
        return;
      }

      if (msg.type === "chatMessage") {
        const payload = JSON.stringify({
          type: "chatMessage",
          user: msg.user ?? "Anonymous",
          content: msg.content,
        });

        let broadcastCount = 0;
        for (const client of clients) {
          if (client !== socket && client.readyState === 1) {
            try {
              client.send(payload);
              broadcastCount++;
            } catch (err) {
              console.error("[CHAT] Send error:", err);
              clients.delete(client);
            }
          }
        }
      }
    });

    socket.on("close", () => {
      clients.delete(socket);
    });

    socket.on("error", (err) => {
      console.error("[CHAT] Socket error:", err);
      clients.delete(socket);
    });
  });

  // --- Direct Messages ---
  const dmClients = new Map(); // userId -> socket
  fastify.decorate("dmClients", dmClients);
  fastify.get("/dm", { websocket: true }, (socket, req) => {
    const senderId = req.session?.user?.id;
    const receiverId = Number(req.query.receiverId);

    if (
      !senderId ||
      !receiverId ||
      senderId.toString() === receiverId.toString()
    ) {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Invalid DM session/receiver",
        })
      );
      socket.close(4001, "Invalid DM");
      return;
    }

    dmClients.set(senderId.toString(), socket);
    socket.send(JSON.stringify({ type: "dmConnected", senderId, receiverId }));

    socket.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      // --- DM text ---
      if (msg.type === "dmMessage" && msg.content) {
        try {
          const conversationId = await getOrCreateConversation(
            senderId,
            receiverId
          );

          // save to DB
          db.run(
            `INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
            [conversationId, senderId, msg.content]
          );

          // check block
          const dbGetAsync = promisify(db.get.bind(db));
          const blocked = await dbGetAsync(
            `SELECT * FROM blockedUsers WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? OR blocked_id = ?)`,
            [receiverId, senderId, senderId, receiverId]
          );
          if (blocked) return;

          // send to receiver
          const dmPayload = JSON.stringify({
            type: "dmMessage",
            conversationId,
            from: senderId,
            to: receiverId,
            fromName: req.session.user.name,
            content: msg.content,
            timestamp: new Date().toISOString(),
          });

          const receiverKey = receiverId.toString();
          if (dmClients.has(receiverKey)) {
            try {
              dmClients.get(receiverKey).send(dmPayload);
            } catch {
              dmClients.delete(receiverKey);
            }
          }

          // confirm to sender
          socket.send(
            JSON.stringify({
              type: "dmSent",
              conversationId,
              to: receiverId,
              content: msg.content,
              timestamp: new Date().toISOString(),
            })
          );
        } catch (err) {
          console.error("[DM] Error:", err);
          socket.send(JSON.stringify({ type: "error", message: "DM failed" }));
        }
      }
      // --- Match invite ---
      else if (msg.type === "matchInvite") {
        const conversationId = await getOrCreateConversation(
          senderId,
          receiverId
        );
        const dmPayload = JSON.stringify({
          type: "dmMessage",
          conversationId,
          from: senderId,
          to: receiverId,
          content: "invites you to a match",
          timestamp: new Date().toISOString(),
        });
        const confirmationPayload = JSON.stringify({
          type: "matchInvitation",
          conversationId,
          from: senderId,
          to: receiverId,
          content: "confirmed",
          timestamp: new Date().toISOString(),
        });
        const receiverKey = receiverId.toString();
        if (dmClients.has(receiverKey)) {
          try {
            dmClients.get(receiverKey).send(dmPayload);
            dmClients.get(receiverKey).send(confirmationPayload);
          } catch {
            dmClients.delete(receiverKey);
          }
        }
      }

      // --- Match confirmation ---
      else if (msg.type === "matchConfirmation") {
        const conversationId = await getOrCreateConversation(
          senderId,
          receiverId
        );
        const roomId = crypto.randomUUID().slice(0, 8);

        const dmPayload = JSON.stringify({
          type: "dmMessage",
          conversationId,
          from: senderId,
          to: receiverId,
          content: "is ready for match",
          timestamp: new Date().toISOString(),
        });
        const launchPayload = JSON.stringify({
          type: "launchMatch",
          conversationId,
          from: senderId,
          to: receiverId,
          content: roomId,
          timestamp: new Date().toISOString(),
        });

        const receiverKey = receiverId.toString();
        if (dmClients.has(receiverKey)) {
          try {
            dmClients.get(receiverKey).send(dmPayload);
            dmClients.get(receiverKey).send(launchPayload);
          } catch {
            dmClients.delete(receiverKey);
          }
        }

        const senderKey = senderId.toString();
        if (dmClients.has(senderKey)) {
          try {
            dmClients.get(senderKey).send(launchPayload);
          } catch {
            dmClients.delete(senderKey);
          }
        }

        socket.send(
          JSON.stringify({
            type: "dmSent",
            conversationId,
            to: receiverId,
            content: `Match confirmed - Room: ${roomId}`,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });

    // cleanup on close/error
    const cleanup = () => dmClients.delete(senderId.toString());
    socket.on("close", cleanup);
    socket.on("error", cleanup);
  });
});

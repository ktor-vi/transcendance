import { openDb } from "../utils/db.js";
import { promisify } from "util";

export default async function blocking(fastify) {
  fastify.post("/blocking", async (req, reply) => {
    const senderId = req.body.senderId;
    const receiverId = req.body.receiverId;
    const blocked = req.body.blocked;

    console.log(`[BLOCK DEBUG] ${senderId}, ${receiverId}, ${blocked}`);
    const db = await openDb();
    console.log("COUCOU");
    if (blocked) {
      await db.run(
        `INSERT OR IGNORE INTO blockedUsers 
	  		(blocker_id, blocked_id)
	  		VALUES (?, ?)`,
        [senderId, receiverId]
      );
    } else {
      await db.run(
        `DELETE FROM blockedUsers WHERE blocker_id = ? AND blocked_id = ?`,
        [senderId, receiverId]
      );
    }
  });
  fastify.post("/blockedStatus", async (req, reply) => {
	  
	  const senderId = req.body.senderId;
	  const receiverId = req.body.receiverId;
	  
	  console.log(`[BLOCK DEBUG] ${senderId}, ${receiverId}`);
	  
	  const db = await openDb();
	  
	  const blockedStatus = await db.get(
		  `SELECT * FROM blockedUsers WHERE (blocker_id = ? AND blocked_id = ?)`,
		  [senderId, receiverId]
		);
		console.log(blockedStatus)
		console.log("coucou CONNARD");
	if(blockedStatus)
		return reply.send({ blocked: true });
	else
		return reply.send({ blocked: false });
});
}

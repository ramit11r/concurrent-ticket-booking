const express = require("express");
const redis = require("./redisClient");
const { v4: uuidv4 } = require("uuid");
const seats = require("./seats.json").seats;
const path = require("path");

const app = express();
app.use(express.json());

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "public")));

const LOCK_TIME = 200;

// View seat status
app.get("/seats", async (req, res) => {
  let result = [];

  for (let seat of seats) {
    const locked = await redis.get(`lock:${seat}`);
    const booked = await redis.get(`booked:${seat}`);

    if (booked) result.push({ seat, status: "BOOKED" });
    else if (locked) result.push({ seat, status: "LOCKED" });
    else result.push({ seat, status: "FREE" });
  }

  res.json(result);
});

// Lock seat
app.post("/lock", async (req, res) => {
  const { seat } = req.body;

  const isBooked = await redis.get(`booked:${seat}`);
  if (isBooked) return res.json({ msg: "Seat already booked" });

  const lockId = uuidv4();

  const success = await redis.set(
    `lock:${seat}`,
    lockId,
    { NX: true, EX: LOCK_TIME }
  );

  if (!success)
    return res.json({ msg: "Seat locked by another user" });

  res.json({ msg: "Seat locked", lockId });
});

// Confirm booking
app.post("/confirm", async (req, res) => {
  const { seat, lockId } = req.body;

  const storedLock = await redis.get(`lock:${seat}`);

  if (storedLock !== lockId)
    return res.json({ msg: "Invalid or expired lock" });

  await redis.del(`lock:${seat}`);
  await redis.set(`booked:${seat}`, "true");

  res.json({ msg: "Seat booked successfully" });
});

app.post("/reset", async (req, res) => {

  const bookedKeys = await redis.keys("booked:*");

  for (let key of bookedKeys) {
    await redis.del(key);
  }

  const lockKeys = await redis.keys("lock:*");

  for (let key of lockKeys) {
    await redis.del(key);
  }

  res.json({ msg: "All seats reset successfully" });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err) => console.log("Redis Error:", err));

(async () => {
  await client.connect();
  console.log("Redis connected");
})();

module.exports = client;
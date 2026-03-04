const { createClient } = require("redis");

const client = createClient({
  url: "redis://127.0.0.1:6379"
});

client.on("error", (err) => console.log("Redis Error:", err));

(async () => {
  await client.connect();
  console.log("Redis connected");
})();

module.exports = client;
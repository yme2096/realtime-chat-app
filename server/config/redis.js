const Redis = require("ioredis");

let redis = null;

const connectRedis = () => {
  try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    redis.on("connect", () => console.log("Redis Connected"));
    redis.on("error", (err) => {
      console.warn("Redis unavailable, falling back to in-memory:", err.message);
      redis = null;
    });
  } catch (err) {
    console.warn("Redis init failed:", err.message);
  }
};

const getRedis = () => redis;

module.exports = { connectRedis, getRedis };

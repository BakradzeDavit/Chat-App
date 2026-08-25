const limits = new Map();

const isRateLimited = (socketId, eventName, limit, windowMs) => {
  const now = Date.now();
  const key = `${socketId}:${eventName}`;

  let entry = limits.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  entry.count++;
  limits.set(key, entry);

  return entry.count > limit;
};

const clearSocketLimits = (socketId) => {
  for (const key of limits.keys()) {
    if (key.startsWith(`${socketId}:`)) {
      limits.delete(key);
    }
  }
};

module.exports = {
  isRateLimited,
  clearSocketLimits,
};

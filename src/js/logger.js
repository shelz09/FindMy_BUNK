// logger.js
const logger = {
  log: (message, level = "INFO") => {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp} → ${message}`);
  },
  warn: (message) => logger.log(message, "WARN"),
  error: (message) => logger.log(message, "ERROR")
};

export default logger;

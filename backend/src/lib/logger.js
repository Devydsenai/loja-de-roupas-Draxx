/**
 * Logs simples com timestamp (substituível por Pino/Winston depois).
 */
function stamp() {
  return new Date().toISOString();
}

export const logger = {
  info(message, meta = {}) {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    console.log(`[${stamp()}] [INFO] ${message}${extra}`);
  },
  warn(message, meta = {}) {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    console.warn(`[${stamp()}] [WARN] ${message}${extra}`);
  },
  error(message, error = null) {
    console.error(`[${stamp()}] [ERROR] ${message}`, error ?? "");
  },
};

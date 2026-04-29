/**
 * Wrapper para não repetir try/catch em cada controller.
 */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

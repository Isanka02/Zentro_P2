/** Returns a JSON or multipart request body as a safe record for controller validation. */
export const getRequestBody = (body: unknown): Record<string, unknown> =>
  body !== null && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};

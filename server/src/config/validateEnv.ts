const required = ["MONGO_URI", "CLIENT_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"] as const;

export const validateEnvironment = (): void => {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ADMIN_EMAIL!) ||
      process.env.ADMIN_PASSWORD!.length < 12 || Buffer.byteLength(process.env.ADMIN_PASSWORD!, "utf8") > 72) {
    throw new Error("ADMIN_EMAIL must be valid and ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes");
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;
  if (accessSecret.length < 32 || refreshSecret.length < 32 || accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different random secrets of at least 32 characters");
  }

  try {
    const configuredClientUrl = process.env.CLIENT_URL!.trim();
    const clientUrl = new URL(configuredClientUrl);
    if (clientUrl.origin !== configuredClientUrl) throw new Error();
    if (clientUrl.protocol !== "http:" && clientUrl.protocol !== "https:") throw new Error();
    if (process.env.NODE_ENV === "production" && clientUrl.protocol !== "https:") {
      throw new Error("CLIENT_URL must use HTTPS in production");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTPS")) throw error;
    throw new Error("CLIENT_URL must be a valid HTTP or HTTPS URL");
  }

  const port = process.env.PORT;
  if (port && (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)) {
    throw new Error("PORT must be a whole number between 1 and 65535");
  }

  const trustProxyHops = process.env.TRUST_PROXY_HOPS;
  if (trustProxyHops !== undefined && trustProxyHops !== "" &&
      (!/^\d+$/.test(trustProxyHops) || Number(trustProxyHops) < 1 || Number(trustProxyHops) > 10)) {
    throw new Error("TRUST_PROXY_HOPS must be a whole number between 1 and 10 when the API runs behind a trusted reverse proxy");
  }

  const cloudinaryValues = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ];
  if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
    throw new Error("Configure all three Cloudinary variables or leave all three empty");
  }

  const bankValues = [
    process.env.BANK_TRANSFER_BANK_NAME,
    process.env.BANK_TRANSFER_ACCOUNT_NAME,
    process.env.BANK_TRANSFER_ACCOUNT_NUMBER,
  ];
  if (bankValues.some(Boolean) && !bankValues.every(Boolean)) {
    throw new Error("Configure the bank name, account name, and account number together");
  }
};

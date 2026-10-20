import bcrypt from "bcryptjs";
import User from "../models/User";

export const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL as string).trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD as string;

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed");
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail });
  if (existingUser?.role === "admin") {
    console.log("Admin account already exists — skipping seed");
    return;
  }
  if (existingUser) {
    throw new Error("ADMIN_EMAIL belongs to a customer account; use a different email or promote that user securely");
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    await User.create({
      name: "Zentro Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });
  } catch (error) {
    // Another application instance may seed the same account concurrently.
    const racedUser = await User.findOne({ email: adminEmail });
    if (racedUser?.role === "admin") return;
    throw error;
  }

  console.log("Admin account seeded successfully");
};

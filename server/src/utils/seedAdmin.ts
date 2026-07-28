import bcrypt from "bcryptjs";
import User from "../models/User";

export const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL as string;
  const adminPassword = process.env.ADMIN_PASSWORD as string;

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed");
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    console.log("Admin account already exists — skipping seed");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.create({
    name: "Zentro Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin account seeded successfully");
};
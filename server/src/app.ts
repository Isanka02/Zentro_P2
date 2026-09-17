import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import discountRoutes from "./routes/discountRoutes";
import orderRoutes from "./routes/orderRoutes";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/orders", orderRoutes);




app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
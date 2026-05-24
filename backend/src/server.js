import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅  Backend running → http://localhost:${PORT}`);
  console.log(`    AI Provider: ${process.env.AI_PROVIDER || "pollinations"}`);
});
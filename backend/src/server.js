// Load Environment Variables paling awal agar terbaca di seluruh sistem
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan dengan standar Enterprise di port ${PORT}`);
});

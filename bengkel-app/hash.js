const bcrypt = require("bcryptjs");

const password = "1234";

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10);

    console.log("=================================");
    console.log("Password Asli :", password);
    console.log("Hash Password :", hash);
    console.log("=================================");
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  }
}

generateHash();

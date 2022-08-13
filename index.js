require("dotenv");
const express = require("express");
const app = express();
const config = require("./config");

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("views/index.html", { root: __dirname });
});

app.listen(config.app.port, () => {
  console.log(`Server is running on port ${config.app.port}`);
});

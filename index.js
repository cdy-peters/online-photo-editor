require("dotenv");
const express = require("express");
const app = express();
const config = require("./config");

app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.listen(config.app.port, () => {
  console.log(`Server is running on port ${config.app.port}`);
});

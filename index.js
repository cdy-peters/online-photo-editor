const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/noscript", (req, res) => {
  res.sendFile(__dirname + "/views/noscript.html");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
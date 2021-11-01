const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res, next) => {
  res.send("Welcome to twitter bot server!");
});

app.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});

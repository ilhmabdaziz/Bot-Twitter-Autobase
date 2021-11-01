const express = require("express");
const app = express();

const { TwitterBot } = require("./twitter-bot");

const PORT = process.env.PORT || 3000;

const twitterBot = new TwitterBot({
  consumer_key: "MstSVj1NhtuCtYb2OhFxzDZ8e",
  consumer_secret: "7EcUTZRlqHo2vVcb9AjWBFb3qGebWp0eQf7p7OQHLsQP37xlbc",
  access_token: "1351298635409944577-vL64XD1BYEywIcnNScobSb7sMjlyyd",
  access_token_secret: "2QxpyVxZyIrlLpcM7hRGe7s0nyuPnwIvduZr8pMw0Y0Vd",
});

app.get("/", (req, res, next) => {
  res.send("Welcome to twitter bot server!");
});

app.get("/adminProfile", async (req, res, next) => {
  const admin = await twitterBot.getAdminUserInfo();
  res.json(admin);
});

app.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});

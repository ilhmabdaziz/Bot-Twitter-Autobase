const express = require("express");
const CronJob = require("cron").CronJob;
const app = express();

const { TwitterBot } = require("./twitter-bot");

const PORT = process.env.PORT || 3000;

const bot = new TwitterBot({
  consumer_key: "MstSVj1NhtuCtYb2OhFxzDZ8e",
  consumer_secret: "7EcUTZRlqHo2vVcb9AjWBFb3qGebWp0eQf7p7OQHLsQP37xlbc",
  access_token: "1351298635409944577-vL64XD1BYEywIcnNScobSb7sMjlyyd",
  access_token_secret: "2QxpyVxZyIrlLpcM7hRGe7s0nyuPnwIvduZr8pMw0Y0Vd",
  triggerWord: "sayaang",
});

const job = new CronJob("*/2 * * * * *", doJob, null, false);
async function doJob() {
  try {
    const authenticatedUserId = await bot.getAdminUserInfo();
    const message = await bot.getDirectMessage(authenticatedUserId);
    // console.log(message, "akhirnya dapat <<<<<<<");
    if (message.id) {
      await bot.tweetMessage(message);
    } else {
      console.log("no tweet to post -----------------------");
    }
  } catch (error) {
    console.log(error);
    console.log("-------------- ERROR ---------------");
  }
}

app.get("/", (req, res, next) => {
  res.send("Welcome to twitter bot server!");
});

app.get("/trigger", async (req, res, next) => {
  job.fireOnTick();
  res.send("job triggered!");
});

app.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});

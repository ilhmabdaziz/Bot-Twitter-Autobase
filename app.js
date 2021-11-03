require("dotenv").config();

const express = require("express");
const CronJob = require("cron").CronJob;
const app = express();

const { TwitterBot } = require("./twitter-bot");

const PORT = process.env.PORT || 3000;

const bot = new TwitterBot({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_KEY_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  triggerWord: process.env.TRIGGER,

  // consumer_key: "MstSVj1NhtuCtYb2OhFxzDZ8e",
  // consumer_secret: "7EcUTZRlqHo2vVcb9AjWBFb3qGebWp0eQf7p7OQHLsQP37xlbc",
  // access_token: "1351298635409944577-vL64XD1BYEywIcnNScobSb7sMjlyyd",
  // access_token_secret: "2QxpyVxZyIrlLpcM7hRGe7s0nyuPnwIvduZr8pMw0Y0Vd",
  // triggerWord: "sayaang",
});

const job = new CronJob("0 */1 * * * *", doJob, null, true);

async function doJob() {
  let tempMessage;
  try {
    const authenticatedUserId = await bot.getAdminUserInfo();
    const message = await bot.getDirectMessage(authenticatedUserId);
    // console.log(JSON.stringify(message, null, 3, "akhirnya dapat <<<<<<<"));
    if (message.id) {
      tempMessage = message;
      const { data } = await bot.tweetMessage(message);
      const response = await bot.deleteMessage(message);
      console.log(
        `... DM has been successfuly reposted with id : ${data.id} @ ${data.created_at}`
      );
      console.log("-----------------------------------------");
    } else {
      console.log("no tweet to post");
      console.log("-----------------------------------------");
    }
  } catch (error) {
    console.log(error, "ERROR.");
    console.log("-----------------------------------------");
    if (tempMessage.id) {
      await bot.deleteMessage(tempMessage);
    }
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

const Twit = require("twit");

class TwitterBot {
  constructor(props) {
    this.T = new Twit({
      consumer_key: props.consumer_key,
      consumer_secret: props.consumer_secret,
      access_token: props.access_token,
      access_token_secret: props.access_token_secret,
    });
  }

  // Get admin user info
  getAdminUserInfo = () => {
    return new Promise((resolve, reject) => {
      this.T.get("account/verify_credentials", { skip_status: true })
        .then((result) => {
          const userId = result.data.id_str;
          resolve(userId);
          // resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  // Get Direct Message
  getDirectMessage = (userId) => {
    return new Promise((resolve, reject) => {
      this.T.get("direct_messages/events/list", (error, data) => {
        if (!error) {
          console.log(userId, "USER ID  <<<<<<<");
          const message = data.events;
          const receivedMessage = this.getReceivedMessages(message, userId);

          console.log(receivedMessage, "messages <<<<");

          resolve(data);
        } else {
          reject("error on get direct message");
        }
      });
    });
  };

  // Filter Message
  getReceivedMessages = (messages, userId) => {
    return messages.filter((msg) => msg.message_create.sender_id != userId);
  };
}

module.exports = { TwitterBot };

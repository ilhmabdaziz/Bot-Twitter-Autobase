const Twit = require("twit");

class TwitterBot {
  constructor(props) {
    this.T = new Twit({
      consumer_key: props.consumer_key,
      consumer_secret: props.consumer_secret,
      access_token: props.access_token,
      access_token_secret: props.access_token_secret,
    });
    this.triggerWord = props.triggerWord;
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

  // Filter Message
  getReceivedMessages = (messages, userId) => {
    return messages.filter((msg) => msg.message_create.sender_id != userId);
  };

  // Filter  no Trigger
  getUnnecessaryMessages = (receivedMessages, trigger) => {
    return receivedMessages.filter((msg) => {
      const message = msg.message_create.message_data.text; // 'Halooo nama gw zizsy sayang'
      const words = this.getEachWord(message); // ['Halooo', 'nama', 'gw', 'zizsy', 'sayaang']
      return !words.includes(trigger);
    });
  };

  // Folter Trigger
  getTriggerMessages = (receivedMessages, trigger) => {
    return receivedMessages.filter((msg) => {
      const message = msg.message_create.message_data.text; // 'Halooo nama gw zizsy sayang'
      const words = this.getEachWord(message); // ['Halooo', 'nama', 'gw', 'zizsy', 'sayaang']
      return words.includes(trigger);
    });
  };

  // Filter isi dari text
  getEachWord = (message) => {
    let words = []; // ['ini', 'line', 'pertama', 'ini', ...]
    let finalWords = []; // ['ini', 'line', ',', 'pertama', ...]
    const separateEnter = message.split("\n"); // ['ini line, pertama', 'ini line kedua']
    separateEnter.forEach((line) => (words = [...words, ...line.split(" ")]));
    words.forEach((word) => {
      const splitComma = word.split(","); // ['line', ',']
      finalWords = [...finalWords, ...splitComma];
    });

    // console.log(finalWords, "final words <<<<<");
    return finalWords;
  };

  // Get Direct Message
  getDirectMessage = (userId) => {
    return new Promise((resolve, reject) => {
      this.T.get("direct_messages/events/list", async (error, data) => {
        if (!error) {
          // console.log(userId, "USER ID  <<<<<<<");
          const messages = data.events;
          const receivedMessages = this.getReceivedMessages(messages, userId);
          const unnecessaryMessages = this.getUnnecessaryMessages(
            receivedMessages,
            this.triggerWord
          );
          const triggerMessages = this.getTriggerMessages(
            receivedMessages,
            this.triggerWord
          );
          // console.log(
          //   JSON.stringify(unnecessaryMessages, null, 3),
          //   "unnes messages <<<<"
          // );
          // console.log(
          //   JSON.stringify(triggerMessages, null, 3),
          //   "trigger messages <<<<"
          // );

          await this.deleteUnnecessaryMessages(unnecessaryMessages);

          resolve(data);
        } else {
          reject("error on get direct message");
        }
      });
    });
  };

  // Method Delete no trigger
  deleteUnnecessaryMessages = async (unnecessaryMessages) => {
    if (unnecessaryMessages.length > 3) {
      for (let i = 0; i < 3; i++) {
        await this.deleteMessage(unnecessaryMessages[i]);
        await this.sleep(2000);
      }
    } else {
      for (const msg of unnecessaryMessages) {
        await this.deleteMessage(msg);
        await this.sleep(2000);
      }
    }
  };

  // Delete Message
  deleteMessage = (message) => {
    return new Promise((resolve, reject) => {
      this.T.delete(
        "direct_messages/events/destroy",
        { id: message.id },
        (error, data) => {
          if (!error) {
            const msg = `Message with id: ${message.id} has been successfuly deleted`;
            console.log(msg);
            resolve({
              message: msg,
              data,
            });
          } else {
            reject(error);
          }
        }
      );
    });
  };

  // Sleep 2 detik
  sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = { TwitterBot };

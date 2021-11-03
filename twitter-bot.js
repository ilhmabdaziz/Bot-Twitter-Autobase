const Twit = require("twit");
const fs = require("fs");

const { downloadMedia } = require("./download");

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
        try {
          if (!error) {
            let lastMessage = {};
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
            await this.deleteMoreThan280CharMsgs(triggerMessages);
            if (triggerMessages[0]) {
              lastMessage = triggerMessages[triggerMessages.length - 1];
            }

            resolve(lastMessage);
          } else {
            reject("error on get direct message");
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  // Upload Media
  uploadMedia = (filePath, type) => {
    return new Promise((resolve, reject) => {
      console.log("Media being uploaded .....");
      const b64content = fs.readFileSync(filePath, { encoding: "base64" });
      if (type === "photo") {
        this.T.post(
          "media/upload",
          { media_data: b64content },
          (error, data) => {
            if (!error) {
              resolve(data);
              console.log("Media has been successfuly uploaded .......");
            } else {
              reject(error);
            }
          }
        );
      } else {
        this.T.postMediaChunked({ file_path: filePath }, (error, data) => {
          if (!error) {
            console.log("Media has been successfuly uploaded ........");
            resolve(data);
          } else {
            reject(error);
          }
        });
      }
    });
  };

  // Tweet Message
  tweetMessage = (message) => {
    return new Promise(async (resolve, reject) => {
      try {
        const text = message.message_create.message_data.text;
        const attachment = message.message_create.message_data.attachment;
        const payload = {
          status: text,
        };

        if (attachment) {
          const shortUrl = attachment.media.url;
          payload.status = text.split(shortUrl)[0];

          const type = attachment.media.type;
          let mediaUrl = "";
          if (type === "animated_gif") {
            mediaUrl = media.video_info.variants[0].url;
          } else if (type === "video") {
            mediaUrl = media.video_info.variants[0].url.split("?")[0];
          } else {
            mediaUrl = attachment.media.media_url;
          }
          const splittedUrl = mediaUrl.split("/");
          const fileName = splittedUrl[splittedUrl.length - 1];
          // console.log(mediaUrl, "media url <<<<<<<<<");
          // console.log(fileName, "file name <<<<<<<<<");

          await downloadMedia(mediaUrl, fileName);
          const uploadedMedia = await this.uploadMedia(fileName, type);
          // console.log(uploadedMedia, "uploaded MEDIA <<<<<<<<<<");
          fs.unlinkSync(fileName);
          console.log("Media has been deleted from local ........");
          payload.media_ids = [uploadedMedia.media_id_string];
        }

        this.T.post("statuses/update", payload, (error, data) => {
          if (!error) {
            console.log(
              `successfuly posting new status with DM id ${message.id}`
            );
            resolve({
              message: `successfuly posting new status with DM id ${message.id}`,
              data,
            });
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
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

  // Delete > 280 char
  deleteMoreThan280CharMsgs = async (triggerMessages) => {
    try {
      let moreThan280 = [];
      for (const [i, msg] of triggerMessages.entries()) {
        let text = msg.message_create.message_data.text;
        const attachment = msg.message_create.message_data.attachment;
        if (attachment) {
          const shortUrl = attachment.media.url;
          text = text.split(shortUrl)[0];
        }
        if (text.length > 280) {
          moreThan280.push(msg);
          await this.deleteMessage(msg);
          await this.sleep(2000);
        }
        if (i + 1 === 3) {
          break;
        }
      }
      for (const msg of moreThan280) {
        const idx = triggerMessages.indexOf(msg);
        triggerMessages.splice(idx, 1);
      }
    } catch (error) {
      throw error;
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

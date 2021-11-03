const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const axios = require("axios");
const fs = require("fs");

const OAuthHelper = (mediaUrl) => {
  const oauth = OAuth({
    consumer: {
      key: "MstSVj1NhtuCtYb2OhFxzDZ8e",
      secret: "7EcUTZRlqHo2vVcb9AjWBFb3qGebWp0eQf7p7OQHLsQP37xlbc",
    },
    signature_method: "HMAC-SHA1",
    hash_function(base_string, key) {
      return crypto
        .createHmac("sha1", key)
        .update(base_string)
        .digest("base64");
    },
  });

  const authorization = oauth.authorize(
    {
      url: mediaUrl,
      method: "GET",
    },
    {
      key: "1351298635409944577-vL64XD1BYEywIcnNScobSb7sMjlyyd",
      secret: "2QxpyVxZyIrlLpcM7hRGe7s0nyuPnwIvduZr8pMw0Y0Vd",
    }
  );

  return oauth.toHeader(authorization);
};

const downloadMedia = async (mediaUrl, fileName) => {
  try {
    const authorization = OAuthHelper(mediaUrl);
    console.log("Download media ...........");
    const { data } = await axios.get(mediaUrl, {
      headers: authorization,
      responseType: "arraybuffer",
    });
    // console.log(mediaUrl, "media url <<<<<<<<<<<<<<");
    fs.writeFileSync(fileName, data);
    console.log("Media has been successfuly downloaded .....");
    return data;
  } catch (error) {
    throw new Error("error from dwonloading media.");
  }
};

module.exports = { downloadMedia };

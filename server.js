const express = require("express");
const Product = require("./models/Product");
const bodyParser = require("body-parser");
const request = require("request");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose
  .connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("data base connecte"))
  .catch((err) => {
    throw new Error(err);
  });

const findBytitle = async (received_message) => {
  const product = await Product.findOne({ title: received_message.text })
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return "err";
    });
  return product;
};

const handleBuying = async (model, title) => {
  const quantity = await Product.findOne({ title })
    .then((res) => {
      console.log("res : ", res.quantity);
      return res.quantity;
    })
    .catch((err) => {
      return "err";
    });
  console.log("quantity 2 : ", quantity);
  if (quantity !== "err") {
    const product = await Product.findOneAndUpdate(
      { title },
      { $set: { quantity: quantity - 1 } }
    )
      .then((res) => {
        return res;
      })
      .catch((err) => {
        return false;
      });
    return product;
  } else {
    const product = false;
    return product;
  }
};
let responses = [];
async function handleMessage(sender_psid, received_message) {
  let response;
  let response2 = null;
  var product = await findBytitle(received_message);

  responses.push(received_message.text);
  // Check if the message contains text
  console.log("responses : ", responses);
  if (received_message.text === "start") {
    response = {
      text: `Enter product title`,
    };
  }
  if (responses[responses.length - 3] === "start") {
    if (product === "err") {
      response = {
        text: `error while connecting to the database`,
      };
    } else if (product === null) {
      response = {
        text: `'this product does not exist'`,
      };
    } else if (product.quantity === 0) {
      response = {
        text: `'the product has been sold'`,
      };
    } else {
      response = {
        text: `do you wanna buy this product for ${product.price}$ ?`,
      };
      response2 = {
        text: `Enter "yes" or "no"`,
      };
    }
  }
  if (
    responses[responses.length - 6] === "start" &&
    received_message.text === "yes"
  ) {
    const ver = handleBuying(Product, responses[responses.length - 4]);
    if (ver) {
      response = {
        text: `the product is getting delievered thank you for buying from our store`,
      };
      response2 = null;
    } else {
      response = {
        text: `error`,
      };
      response2 = null;
    }
  } else if (
    responses[responses.length - 6] === "start" &&
    received_message.text === "no"
  ) {
    response = {
      text: `ok restrat th process?`,
    };
  }

  // Sends the response message
  callSendAPI(sender_psid, response);
  if (response2 !== null) {
    callSendAPI(sender_psid, response2);
    response2 = null;
  }
}
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}
// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  let body = req.body;
  console.log("webhook post");
  // Checks this is an event from a page subscription
  if (body.object === "page") {
    console.log("entry");

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    console.log("entry didnt work");
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  let VERIFY_TOKEN = "test";

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.log("didnt work");
      res.sendStatus(403);
    }
  }
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(
    "Express server listening on port %d in %s mode",
    server.address().port,
    app.settings.env
  );
});

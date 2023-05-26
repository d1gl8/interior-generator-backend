require("dotenv").config();
const isDev = process.env.NODE_ENV === "dev";
module.exports = { isDev };

const fsp = require("fs").promises;
const crypto = require("crypto");

const express = require("express");
const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const asyncHandler = require("express-async-handler");
const port = process.env.EXPRESS_PORT;
const router = require("./router");
const { outFetch } = require("./plugins/axios");

const { logRequest, logResponse } = require("./logger");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formidableMiddleware());

let hash, session, start;
app.use(
  asyncHandler(async (req, res, next) => {
    isDev && (await fsp.truncate("./logs/http.log")); // only for dev
    session = req.headers.session;
    start = req.headers["request-start"];
    hash = crypto.randomBytes(8).toString("hex");

    if (req.statusCode !== 200) {
      console.log("express catch");
      console.log(req);
      // console.log(res   + "\n");
      throw new Error("express catch");
    }
    req.metadata = { hash, session, start };
    logRequest(req);
  })
);
outFetch.interceptors.request.use(
  (req) => {
    req.metadata = { hash, session, start: Date.now().toString() };
    logRequest(req, false);
    return req;
  },
  (err) => {
    console.log("error axios request");
  }
);
outFetch.interceptors.response.use(
  (res) => {
    logResponse(res, false);
    return res;
  },
  (err) => {
    console.log("error axios response", err);
    // console.log("error axios response", err);
    throw new Error(err);
  }
);

app.use(router);

app.use((error, req, res, next) => {
  error && console.log("error express");

  // if (err) {
  //   res.status(500).json({ error: err?.toString() });
  //   console.error("--- ERROR ---\n", err.stack);
  // }
  // logResponse(res, true);
});

app.listen(port, () => {
  console.log(`Artixel express server starting on port ${port}`);
});

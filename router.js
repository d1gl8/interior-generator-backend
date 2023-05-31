const express = require("express");
const router = express.Router();
require("express-async-errors");

const { isDev } = require("./index");
const fs = require("fs");
const fsp = require("fs").promises;
const FormData = require("form-data");
const crypto = require("crypto");
const { outFetch } = require("./plugins/axios");
const { logRequest, logResponse } = require("./logger");

let hash, session, start;
router.use(async (req, res, next) => {
  isDev && (await fsp.truncate("./logs/http.log")); // only for dev
  session = req.headers.session;
  start = req.headers["request-start"];
  hash = crypto.randomBytes(8).toString("hex");

  req.metadata = { hash, session, start };
  logRequest(req);
  next();
});

outFetch.interceptors.request.use(
  (req) => {
    req.metadata = { hash, session, start: Date.now().toString() };
    logRequest(req, false);
    return req;
  },
  (err) => {
    console.log("error axios request");
    throw err;
  }
);
outFetch.interceptors.response.use(
  (res) => {
    logResponse(res, false);
    return res;
  },
  (err) => {
    console.log("error axios response");
    throw err;
  }
);

router.get("/api/check", async (req, res, next) => {
  res
    .status(200)
    .send(
      `Artixel express server is working ${new Date().toLocaleString("ru-RU")}`
    );
});

router.post("/api/cleaner/image", async (clientReq, clientRes, next) => {
  const inputFile = clientReq.files.file;

  let inputData = new FormData();
  inputData.append("file", fs.readFileSync(inputFile.path), inputFile.name);

  const aiReq = await outFetch("/predict", {
    headers: {
      session: clientReq.headers.session,
      "content-type": clientReq.headers["content-type"],
    },
    method: "POST",
    data: inputData,
  });

  // const aiReq = await outFetch("/get_error");

  clientRes.status(200).json(aiReq.data);
  next(clientRes);
});

router.post("/api/cleaner/mask", async (clientReq, clientRes, next) => {
  const inputLink = clientReq.fields.image_file;
  const maskFile = clientReq.files.mask_file;
  let inputData = new FormData();
  inputData.append("image_string_bytes", inputLink);
  inputData.append("mask_file", fs.readFileSync(maskFile.path), maskFile.name);

  const aiReq = await outFetch(
    process.env.API_PRODUCTION_URL + "/api/user_mask_predict",
    {
      headers: {
        "content-type": clientReq.headers["content-type"],
      },
      method: "POST",
      data: inputData,
    }
  );
  clientRes.send(aiReq.data);
  next(clientRes);
});

router.post("/api/report/bug", async (clientReq, clientRes, next) => {
  const { name, path } = clientReq.files.report;
  await fsp.writeFile("./reports/" + name, await fsp.readFile(path));
  // @! палка
  clientReq.resBody = { msg: "we have received your report" };
  //
  clientRes.status(200).send(clientReq.resBody);
  next(clientRes);
});

router.use((err, req, res, next) => {
  if (err instanceof Error) {
    res
      .status(err?.response?.status || 500)
      .send(err?.message || "Something went wrong");
  }
  logResponse(res);
});

module.exports = router;

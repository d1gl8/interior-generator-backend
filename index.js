require("dotenv").config();
const fs = require("fs");
const fsp = require("fs").promises;
const express = require("express");
const port = process.env.EXPRESS_PORT;
const cors = require("cors");
const formidableMiddleware = require("express-formidable");

const axios = require("axios");
const FormData = require("form-data");
const { logRequest, logResponse } = require("./logger");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formidableMiddleware());
app.use(async (req, res, next) => {
  // await fsp.truncate("./logs/http.log"); // !@ only for dev

  logRequest(req);
  next();
});
axios.interceptors.request.use((req) => {
  logRequest(req, false);
  return req;
});
axios.interceptors.response.use((res) => {
  logResponse(res, false);
  return res;
});

app.get("/api/check", (req, res, next) => {
  res
    .status(200)
    .send(
      `Artixel express server is working ${new Date().toLocaleString("ru-RU")}`
    );
});

app.post("/api/cleaner/image", async (clientReq, clientRes, next) => {
  // try {
  const inputFile = clientReq.files.file;

  let inputData = new FormData();
  inputData.append("file", fs.readFileSync(inputFile.path), inputFile.name);

  const aiReq = await axios(process.env.API_PRODUCTION_URL + "/api/predict", {
    headers: {
      session: clientReq.headers.session,
      "content-type": clientReq.headers["content-type"],
    },
    method: "POST",
    data: inputData,
  });

  clientRes.status(200).json(aiReq.data);
  next(clientRes);
  // }
  // catch (err) {
  //   throw new Error(err.toString());
  // }
  //   finally {
  // }
});

app.post("/api/cleaner/mask", async (clientReq, clientRes, next) => {
  // try {
  const inputLink = clientReq.fields.image_file;
  const maskFile = clientReq.files.mask_file;
  let inputData = new FormData();
  inputData.append("image_string_bytes", inputLink);
  inputData.append("mask_file", fs.readFileSync(maskFile.path), maskFile.name);

  const aiReq = await axios(
    process.env.API_PRODUCTION_URL + "/api/user_mask_predict",
    {
      headers: {
        session: clientReq.headers.session,
        "content-type": clientReq.headers["content-type"],
      },
      method: "POST",
      data: inputData,
    }
  );
  clientRes.send(aiReq.data);
  next(clientRes);
  // } catch (err) {
  //   next(err);
  // } finally {
  // }
});

app.post("/api/report/bug", async (clientReq, clientRes, next) => {
  // try {
  const { name, path } = clientReq.files.report;
  await fsp.writeFile("./reports/" + name, await fsp.readFile(path));
  // @! палка
  //
  clientReq.resBody = { msg: "we have received your report" };
  clientRes.status(200).send(clientReq.resBody);
  next(clientRes);
  // } catch (err) {
  //   next(err);
  // } finally {
  //   next(clientRes);
  // }
});

app.use((err, req, res, next) => {
  // if (err) {
  //   res.status(500).json({ error: err?.toString() });
  //   console.error("--- ERROR ---\n", err.stack);
  // }
  logResponse(res, true);
});

app.listen(port, () => {
  console.log(`Artixel express server starting on port ${port}`);
});

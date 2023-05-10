require("dotenv").config();
const express = require("express");
const port = process.env.EXPRESS_PORT;
const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const FormData = require("form-data");

const fs = require("fs");
const fsp = require("fs").promises;

const { errorHandler } = require("./functions");
const { logRequest, logResponse, loggerHttp } = require("./logger");

const axios = require("axios");

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
axios.interceptors.request.use((req) => logRequest(req, false));
axios.interceptors.response.use((res) => {
  console.log(res.config.url + " response status", res.status);
  logResponse(res, false);
  return res;
});

app.get("/api/check", (req, res, next) => {
  try {
    res
      .status(200)
      .send(
        `Artixel resender-logger is working ${new Date().toLocaleString(
          "ru-RU"
        )}`
      );
  } catch (err) {
    next(err);
  } finally {
    next(res);
  }
});

app.post("/api/cleaner/image", async (clientReq, clientRes, next) => {
  try {
    const inputFile = clientReq.files.file;

    let inputData = new FormData();
    inputData.append("file", fs.readFileSync(inputFile.path), inputFile.name);

    const aiReq = await axios(process.env.API_PRODUCTION_URL + "/api/predict", {
      headers: {
        "content-type": clientReq.headers["content-type"],
      },
      method: "POST",
      data: inputData,
    });

    clientRes.status(200).json(aiReq.data);
  } catch (err) {
    next(err);
  } finally {
    next(clientRes);
  }
});

app.post("/api/cleaner/mask", async (clientReq, clientRes, next) => {
  try {
    const inputLink = clientReq.fields.image_file;
    const maskFile = clientReq.files.mask_file;
    let inputData = new FormData();
    inputData.append("image_string_bytes", inputLink);
    inputData.append(
      "mask_file",
      fs.readFileSync(maskFile.path),
      maskFile.name
    );

    const aiReq = await axios(
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
  } catch (err) {
    next(err);
  } finally {
    next(clientRes);
  }
});

app.post("/api/report/bug", async (clientReq, clientRes) => {
  try {
    const { name, path } = clientReq.files.report;
    await fsp.writeFile("./reports/" + name, await fsp.readFile(path));
    clientRes.status(200).json({ msg: "we have received your report" });
  } catch (err) {
    next(err);
  } finally {
    next(clientRes);
  }
});

app.use((err, req, res, next) => {
  if (err) errorHandler(err);
  logResponse(res, true);
});

app.listen(port, () => {
  console.log(`Artixel resender-logger starting on port ${port}`);
});

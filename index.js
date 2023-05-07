require("dotenv").config();
const fs = require("fs");
const fsp = require("fs").promises;
const express = require("express");
const https = require("https");
const FormData = require("form-data");
const port = process.env.EXPRESS_PORT;
const app = express();

// const key = fs.readFileSync(__dirname + "/selfsigned.key", "utf8");
// const cert = fs.readFileSync(__dirname + "/selfsigned.crt", "utf8");
// const options = {
//   key: key,
//   cert: cert,
// };

const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const { errorHandler } = require("./functions");

const axios = require("axios");
const { logRequest, logResponse, loggerHttp } = require("./logger");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formidableMiddleware());
app.use((req, res, next) => {
  logRequest(req);
  next();
});
axios.interceptors.request.use(logRequest);
axios.interceptors.response.use(logResponse);

app.post("/api/cleaner/image", async (clientReq, clientRes, next) => {
  try {
    const inputFile = clientReq.files.file;

    let inputData = new FormData();
    inputData.append("file", fs.readFileSync(inputFile.path), inputFile.name);

    const aiReq = await axios(process.env.API_PRODUCTION_URL + "/api/predict", {
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

app.post("/api/cleaner/mask", async (clientReq, clientRes) => {
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
        method: "POST",
        data: inputData,
      }
    );
    clientRes.send(aiReq.data);
  } catch (err) {
    errorHandler(clientRes, err);
  }
});

app.post("/api/report/bug", async (clientReq, clientRes) => {
  try {
    const { name, path } = clientReq.files.report;
    await fsp.writeFile("./reports/" + name, await fsp.readFile(path));
    clientRes.status(200).json({ msg: "we have received your report" });
  } catch (err) {
    errorHandler(clientRes, err);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  logResponse(res);
});

// const server = https.createServer(options, (req, res) => {
//   app(req, res);
// });

// server.listen(port, () => {
//   console.log(`Artixel resender starting on port ${port}`);
// });

app.listen(port, () => {
  console.log(`Artixel resender starting on port ${port}`);
});

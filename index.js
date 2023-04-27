require("dotenv").config();
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const formidableMiddleware = require("express-formidable");
const { errorHandler } = require("./functions");

const port = process.env.EXPRESS_PORT;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formidableMiddleware());

app.post("/cleaner/image", async (clientReq, clientRes) => {
  try {
    const inputFile = clientReq.files.file;

    let inputData = new FormData();
    inputData.append(
      "file",
      new Blob([fs.readFileSync(inputFile.path)]),
      inputFile.name
    );

    const aiReq = await fetch(process.env.API_PRODUCTION_URL + "/api/predict", {
      method: "POST",
      body: inputData,
    });
    const outputReader = aiReq.body.getReader();

    clientRes.writeHead(200, {
      "Content-Type": aiReq.headers.get("content-type"),
    });

    while (true) {
      const { done, value } = await outputReader.read();

      if (done) break;

      clientRes.write(value);
    }

    outputReader.releaseLock();
  } catch (err) {
    errorHandler(clientRes, err);
  } finally {
    clientRes.end();
  }
});

app.post("/cleaner/mask", async (clientReq, clientRes) => {
  try {
    const inputFile = clientReq.files.image_file;
    const inputFileMask = clientReq.files.mask_file;
    let inputData = new FormData();
    inputData.append(
      "image_file",
      new Blob([fs.readFileSync(inputFile.path)]),
      inputFile.name
    );
    inputData.append(
      "mask_file",
      new Blob([fs.readFileSync(inputFileMask.path)]),
      inputFile.name
    );

    const aiReq = await fetch(
      process.env.API_PRODUCTION_URL + "/api/user_mask_predict",
      {
        method: "POST",
        body: inputData,
      }
    );
    const outputReader = aiReq.body.getReader();
    clientRes.writeHead(200, {
      "Content-Type": aiReq.headers.get("content-type"),
    });

    while (true) {
      const { done, value } = await outputReader.read();

      if (done) break;

      clientRes.write(value);
    }

    outputReader.releaseLock();
  } catch (err) {
    errorHandler(clientRes, err);
  } finally {
    clientRes.end();
  }
});

app.listen(port, () => {
  console.log(`Artixel resender starting on port ${port}`);
});

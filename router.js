const express = require("express");
const router = express.Router();

const fs = require("fs");
const FormData = require("form-data");
const { outFetch } = require("./plugins/axios");

router.get("/api/check", async (req, res, next) => {
  res
    .status(200)
    .send(
      `Artixel express server is working ${new Date().toLocaleString("ru-RU")}`
    );
});

router.post("/api/cleaner/image", async (clientReq, clientRes, next) => {
  // try {
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

  clientRes.status(200).json(aiReq.data);
  next(clientRes);
  // }
  // catch (err) {
  //   throw new Error(err.toString());
  // }
  //   finally {
  // }
});

router.post("/api/cleaner/mask", async (clientReq, clientRes, next) => {
  // try {
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
  // } catch (err) {
  //   next(err);
  // } finally {
  // }
});

router.post("/api/report/bug", async (clientReq, clientRes, next) => {
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

module.exports = router;

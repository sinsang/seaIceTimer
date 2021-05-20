const express = require("express");
const key = require("./key");
const app = express();
//var port = normalizePort(process.env.PORT || '3000');

console.log(key.encodedKey);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3000, () => {
    console.log("돌아가는중")
});
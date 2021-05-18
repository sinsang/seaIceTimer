const express = require("express");

const app = express();
//var port = normalizePort(process.env.PORT || '3000');

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3000, () => {
    console.log("돌아가는중")
});
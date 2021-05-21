const axios = require("axios");
const express = require("express");
const key = require("./key");
const app = express();
//var port = normalizePort(process.env.PORT || '3000');

var nowTotal = 0;
var leftTime = 0;
var rate = 0;
var leftTime = 0;
var nowState = false;

var apiURL = (year, month) => {
    var startDate = "" + year + month;
    var endDate = "" + year + month;
    return "https://www.kdhc.co.kr:443/openapi-data/service/kdhcCarbon/carbon?startDate=" + startDate + "&endDate=" + endDate + "&pageNo=1&numOfRows=300&serviceKey=";
}

var getNewData = () => {

    let today = new Date();
    let y = today.getFullYear();
    let m = today.getMonth();

    if (m == 0){
        y -= 1;
        m = 12;
    }
    if (m < 10) m = "0" + m;

    axios(apiURL(y, m) + key.encodedKey).then((res) => {
        console.log(res.data.response);

        var items = res.data.response.body.items.item;
        var total = 0;
        
        for (var i = 0; i < items.length; i++){
            console.log(items[i]);
            total += parseFloat(items[i].totEmTco2eq);
        }

        console.log("총 배출량 : " + total);
        console.log("총 item 개수 : " + items.length);

        total = total * (19/items.length);
        total *= 12;
        total *= (100/0.7);
        total *= 50;
        
        rate = total / 35000000000;

        console.log(total);
        console.log(rate);

        tmp = new Date("2050-12-31");
        leftTime = tmp.getTime() - today.getTime();
        leftTime -= (leftTime * (rate-1));
        leftTime = new Date(leftTime);

        nowState = true;
        nowTotal = total;
    });
}

getNewData();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    if (nowState) {
        res.render("seaIceTimer", {
           rate : rate, 
           leftYear : leftTime.getFullYear() - 1970,
           leftMonth : leftTime.getMonth(),
           leftDate : leftTime.getDate()
        });
    }
    else {
        res.send("서버 로딩 중입니다.");
    }
});

app.get("/renewData/:pw", (req, res) => {
    if (req.params.pw == key.adminKey){
        nowState = false;
        getNewData();
        res.redirect("/");
    }
    else {
        res.send("잘못된 접근입니다.");
    }
});

app.listen(3000, () => {
    console.log("돌아가는중")
});
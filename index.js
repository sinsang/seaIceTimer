const axios = require("axios");
const express = require("express");
const key = require("./key");
const app = express();
var port = (process.env.PORT || '3000');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}

var nowTotal = 0;
var leftTime = 0;
var rate = 0;
var leftTime = 0;
var nowState = false;

// 좋은 상황에서의 문구
var dangerComment1_good = [
    "상황은 더 좋아질 수 있습니다.\n더 노력해주세요.",
    "우리가 계속 행동한다면, 더 늦출 수 있습니다.",
    "점점 더 좋아질 겁니다.\n해빙도, 우리도."
];

// 그저그런 상황에서의 문구
var dangerComment1_soso = [
    "멀지 않은 미래, 완전히 해빙이 사라질 수 있습니다",
    "더 앞당겨진다면, 우리가 기후를 통제할 수 없을겁니다",
    "나 하나만이 아닙니다, 전 지구인의 운명이 달린 문제입니다."
];

// 안좋은 상황에서의 문구
var dangerComment1_bad = [
    "기후재앙이 코 앞입니다",
    "언제까지 두고만 볼겁니까?\n해빙이 다 녹을 때 까지?",
    "탄소감축, 오늘 실천하지 않으면 내일이 사라집니다",
    ""
];

// 한반도 부분 문구
var dangerComment2 = [
    "대한민국은 천도를 고민해야 할 겁니다.<br/>서울이 침수될 수도 있거든요.",
    "부산 해운대가 없어질 지도 모릅니다.<br/>부산 앞 바다가 지금도 육지로 올라오고 있습니다.",
    "미래의 대한민국 제 1의 공항은 어딜까요?<br/>일단 인천공항은 아닙니다. 바다에 잠길 위기입니다.",
    "대한민국은 2계절이 뚜렷한 나라입니다.<br/>잘못된 것 같다구요?<br/>곧 올바른 말이 될 것입니다.",
    "이젠 대한민국 겨울에 눈이 내리지 않습니다.<br/>대신 태풍이 칩니다.",
    "이 지도가 우리 자손에게 생길 일이라 생각하지 마세요.<br/>우리에게도 다가오고 있습니다.",
];

let today = new Date();
let t_year = today.getFullYear();
let t_month = today.getMonth();

var apiURL = (year, month) => {
    var startDate = "" + year + month;
    var endDate = "" + year + month;
    return "https://www.kdhc.co.kr:443/openapi-data/service/kdhcCarbon/carbon?startDate=" + startDate + "&endDate=" + endDate + "&pageNo=1&numOfRows=300&serviceKey=";
}

var getNewData = (y, m) => {

    nowState = false;

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

        if (total == 0) {
            console.log("재탐색합니다")
            getNewData(y, m-1);
        }
        else {
            console.log("서버 설정 완료");

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
        }
    });
}

getNewData(t_year, t_month);

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    if (nowState) {

        var dc1 = "";
        if (rate >= 1.3) dc1 = dangerComment1_bad[getRandomInt(0, dangerComment1_bad.length)];
        else if (rate >= 1.0) dc1 = dangerComment1_soso[getRandomInt(0, dangerComment1_soso.length)];
        else dc1 = dangerComment1_good[getRandomInt(0, dangerComment1_good.length)];

        res.render("seaIceTimer", {
           rate : rate, 
           dangerComment1 : dc1,
           dangerComment2 : dangerComment2[getRandomInt(0, dangerComment2.length)],
           leftYear : leftTime.getFullYear() - 1970,
           leftMonth : leftTime.getMonth(),
           leftDate : leftTime.getDate()
        });
    }
    else {
        res.send("서버 로딩 중입니다. 잠시 후 새로고침 해주세요.");
    }
});

app.get("/renewData/:pw", (req, res) => {
    if (req.params.pw == key.adminKey){
        getNewData(t_year, t_month);
        res.redirect("/");
    }
    else {
        res.send("잘못된 접근입니다.");
    }
});

app.listen(port, () => {
    console.log("돌아가는중")
});
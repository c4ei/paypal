const dotenv = require("dotenv");
require("dotenv").config();
const express = require("express");
const paypal = require("./services/paypal");
var path = require("path");
var cookieParser = require("cookie-parser");
// var logger = require('morgan');
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
app.options("*", cors());
//###########################
//npm install --save express-session
// npm install --save session-file-store
const session = require("express-session");
const FileStore = require("session-file-store")(session); // 1
app.use(
  session({
    secret: process.env.SessionSecret, // 암호화
    saveUninitialized: true,
    resave: false,
    store: new FileStore(),
  })
);
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

app.set("view engine", "ejs");
app.use("/", cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL 데이터베이스 연결 설정
const mysql = require("mysql2/promise");
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE
};
const pool = mysql.createPool(dbConfig);
const getConn = async() => {
    return await pool.getConnection(async (conn) => conn);
    // return await pool.getConnection();
}
async function loadDB(strSQL){
    const connection = await getConn();
    // let [rows, fields] = await connection.query(strSQL);
    let rows = await connection.query(strSQL);
    // console.log(rows);
    console.log(strSQL);
    connection.release();
    return rows;
}

async function saveDB(strSQL){
  const connection = await getConn();
  try {
      await connection.beginTransaction();
      await connection.query(strSQL);
      await connection.commit();
      // console.log('success!');
  } catch (err) {
      await connection.rollback();
      // throw err;
      console.log(getCurTimestamp() +' ' + err.sqlMessage);
  } finally {
      connection.release();
  }
}

app.get("/home",async function (req, res, next) {
  let _refAAH_addr = "";
  if (req.cookies.refAAH == "" || req.cookies.refAAH === undefined) {
  } else {
    _refAAH_addr = req.cookies.refAAH;
  }
  // let sql_sel1 = "";
  // sql_sel1 = sql_sel1 + " SELECT ";
  // sql_sel1 = sql_sel1 + " 	idx,AAH_amt,AAH_bal,ETH_amt,ETH_bal ";
  // sql_sel1 = sql_sel1 + " 	,BNB_amt,BNB_bal,MATIC_amt,MATIC_bal ";
  // sql_sel1 = sql_sel1 + " 	,TRX_amt,TRX_bal,C4EI_amt,C4EI_bal ";
  // sql_sel1 = sql_sel1 + " 	,USDT_amt,USDT_bal ";
  // sql_sel1 = sql_sel1 + " FROM c4ex_amt_sum limit 1";
  // console.log( "######### index.js 124 home  ######### " + getCurTimestamp() + " sql_sel1: " + sql_sel1 );
  // let result1 = loadDB(sql_sel1);
  // if (result1.length > 0) {
  //   console.log( "######### index.js 127  ######### " + getCurTimestamp() + " result1: " + result1[0].idx );
  //   res.render("home", { title: "AAH HOME",result: result1,refAAH_addr: _refAAH_addr, });
  // } else {
    res.render("home", { title: "AAH HOME",result: "nodata",refAAH_addr: _refAAH_addr, });
  // }
});

app.get("/c4ei_net", function (req, res, next) {
  res.redirect("/home");
});

app.get("/", async function (req, res, next) {
  // let sql1 = "SELECT idx,address from address WHERE useYN ='Y' AND mappingYN='N' ORDER BY idx LIMIT 1";
  // let result1 = await loadDB(sql1);
  // if(result1.length>0){}
  var user_ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  // console.log(user_ip + " : user_ip / " + getCurTimestamp());
  // try {
  //   let ref = jsfnRepSQLinj(req.params.ref);
  //   console.log("########################################");
  //   console.log("추천인 타고들어옴 ref:" + ref);
  //   console.log("########################################");
  // } catch (e) {}
  // if (req.cookies.user_idx == "" || req.cookies.user_idx === undefined) {
    res.redirect("https://ai.c4ex.net");
    return;
  // }
});

// https://tel3.c4ei.net/paypal/0xA6cc84a3a09968090Ec1F14715842f00C6AD8658
app.get("/paypal", (req, res) => {
  let result="nodata" , rcv_addr="";
  res.render("paypal" , { result: result, rcv_addr: rcv_addr });
});
app.get("/paypal/:id", (req, res) => {
  let rcv_addr = jsfnRepSQLinj(req.params.id);
  let sql = "";
  sql = sql + " SELECT user_id, address, user_name FROM telegramairdropbot.users WHERE address='" + rcv_addr + "' ";
  let result = loadDB(sql);
  if (result.length > 0) {
    
  }else{
    result="nodata";
  }
  console.log( "######### index.js 124  ######### " + getCurTimestamp() + " sql: " + sql );
  res.render("paypal" , { result: result, rcv_addr: rcv_addr });
});

app.post("/pay", async (req, res) => {
  try {
    const url = await paypal.createOrder();

    res.redirect(url);
  } catch (error) {
    res.send("Error: " + error);
  }
});

app.get("/complete-order", async (req, res) => {
  try {
    await paypal.capturePayment(req.query.token);

    res.send("Course purchased successfully");
  } catch (error) {
    res.send("Error: " + error);
  }
});

app.get("/cancel-order", (req, res) => {
  res.redirect("/paypal");
});

app.get("/ref/:id", function (req, res, next) {
  let ref_addr = jsfnRepSQLinj(req.params.id);
  let sql = "";
  sql = sql + " SELECT id, c4ei_addr, last_ip ";
  sql = sql + " FROM game_user WHERE c4ei_addr='" + ref_addr + "' ";
  console.log( "######### index.js 225  ######### " + getCurTimestamp() + " sql: " + sql );
  let result = loadDB(sql);
  if (result.length > 0) {
    console.log( "######### index.js 228  ######### " + getCurTimestamp() + " result: " + result[0].c4ei_addr );
    res.render("ref", { title: "ref friend", result: result });
  } else {
    res.render("ref", { title: "ref friend", result: "nodata" });
  }
});

app.post("/ref_ok", function (req, res, next) {
  var txt_ref_addr = req.body.txt_ref_address;
  var txt_ref_id = req.body.txt_ref_id;
  var txt_my_addr = req.body.txt_my_address;
  var user_ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  // console.log(" ### 291 ### "+txt_my_addr + " : txt_my_addr ");
  getAddressCheck(txt_ref_addr);
  getAddressCheck(txt_my_addr);
  getUserInfoByAddress(txt_my_addr, user_ip);
  let sql = "";
  sql = sql + " SELECT id, c4ei_addr, last_ip FROM game_user WHERE id='" + txt_ref_id + "' ";
  console.log( "######### index.js 247  ######### " + getCurTimestamp() + " sql: " + sql );
  let result = loadDB(sql);
  if (result.length > 0) {
    if (userAcct.reffer_id == "0") {
      // my ref
      let result2 = saveDB( "update game_user set reffer_id='" + txt_ref_id + "' ,reffer_cnt=reffer_cnt+1, last_reg=now(),last_ip='" + user_ip + "' where id='" + userAcct.id + "'" );
      let result3 = saveDB( "update game_user set reffer_cnt=reffer_cnt+1, last_reg=now() where id='" + txt_ref_id + "'" );
    } else {
      res.render("error", { msg: "you alredy reffer registered" });
      return;
    }
  }
  console.log( " ### 258 ### " + userAcct.loginCnt + " : loginCnt / TMDiff : " + userAcct.TMDiff );
  res.render("error", { msg: "you success reffer registered" });
});

function jsfnRepSQLinj(str) {
  str = str.replace("'", "`");
  str = str.replace("--", "");
  return str;
}

function getCurTimestamp() {
  const d = new Date();

  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds()
    )
    // `toIsoString` returns something like "2017-08-22T08:32:32.847Z"
    // and we want the first part ("2017-08-22")
  )
    .toISOString()
    .replace("T", "_")
    .replace("Z", "");
}

app.listen(process.env.PORT, () =>
  console.log("Server started on port " + process.env.PORT)
);

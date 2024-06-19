const express = require('express');
const app = express();
const dotenv = require('dotenv');
const session = require('express-session');
const fileStore = require('session-file-store')(session);
const nunjucks = require('nunjucks');
const webSocket = require('./socket');
const port = 3001;

dotenv.config();

app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true
})

app.use(express({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new fileStore()
}))

app.get('/', (req, res)=>{
    res.render('index');
})

const server = app.listen(port, ()=>{
    console.log(`${port} 실행중`);
})

webSocket(server); //웹 소켓과 서버 연결
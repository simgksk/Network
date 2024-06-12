//Express 메인 파일
const express = require('express')
const bodyParser = require('body-parser');

const url = require('url');
const fs = require('fs');
const qs = require('querystring');
//const cookieParser = require('cookie-parser');
const session = require('express-session');
const fileStore = require('session-file-store')(session);
const templateObject = require('./lib/template.js');
const authStatus = require('./lib/auth.js');
const shortid = require('shortid');
const app = express()
const port = 3000

//lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({users: [], topics: []}).write();

//미들웨어 (순서가 매우 중요!) //next: 말 그대로 다음 미들웨어로 넘어가는 매개변수
app.use(bodyParser.urlencoded({extended: false}))
//app.use(cookieParser());
app.use(session({
    secret: 'spxmdnjzmtndjq', 
    resave: false,
    saveUninitialized: true,
    store: new fileStore()
}))

//passport 관련 모아두기 (session 다음에 위치)
const passport = require('passport');
const LocalStrategy = require('passport-local');

app.use(passport.initialize());
app.use(passport.session());

//로그인 성공 passport에서 세션 처리
passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser((userid, done)=>{
    //console.log(userid);
    const user = db.get('users').find({id:userid}).value();
    done(null, user);
})

// passport 체계로 로그인 변경
app.post('/process_login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login'
}));

passport.use(new LocalStrategy(function verify(username, password, cb){
    console.log('Local: ', username, password);
    const user = db.get('users').find({email: username, pwd: password}).value();
    if(user){
        //로그인
        return cb(null, user);
    }
    else{
        //로그인 실패
        return cb(null, false, {message: "User not found"});
    }
}));

// 페이지 방문 횟수 응답
app.use((req, res, next)=>{
    if(!req.session.views)
    {
        req.session.views = 0;
    }
    req.session.views += 1;
    next();
})

//readdir를 미드웨어로 //모든 get 요청에 대해서만 실행 (경로지정)
app.get('*', (req, res, next)=>{
    // //폴더 내 글 목록을 list에 저장
    // fs.readdir('./page', function(err, filelist){
    //     req.list = filelist;
    //     next(); //req 데이터를 그대로 다음 미들웨어로 전달
    // });

    //폴더 내 글 목록 filelist에 저장
    const filelist = db.get('topics').value();
    req.list = filelist;
    next();
})

//정적 파일 미들웨어
app.use(express.static('public'));

//라우팅 --> path마다 응답
//메인 페이지
app.get('/', (req, res) => {

    //파일 목록 불러오기
    console.log(req.user);
    const title = 'Welcome';
    const data = `첫 번째 페이지
    <p>
        <img src="/BMO.jpg" style="width:300px">
    </p>
    `;

    const list = templateObject.list(req.list);
    const template = templateObject.html(title, list, data, '', authStatus(req,res));
    //쿠키 전달
    res.cookie('myCookie', '홍길동');
    console.log(req.cookies);
    res.send(template); //writeHead + end
});

//목차 페이지 라우팅(라우트 파라미터 사용)
app.get('/page/:pageId', (req, res, next)=>{
    const topic = db.get('topics').find({id: req.params.pageId}).value();
    const writer = db.get('users').find({id: topic.user_id}).value();
            const title = topic.title;
            const list = templateObject.list(req.list);
            const deleteForm =`
                <form action="/process_delete" method="post">
                <!-- 삭제할 글 제목 -->
                    <input type="hidden" name="id" value="${title}">
                        <input type="submit" value="delete">
                </form>
            `;
    
            const template = templateObject.html(title, list, topic.des + `<p> by. ${writer.displayName}</p>`,
            `<a href="/update/${title}">글 수정</a> ${deleteForm}`, authStatus(req,res));
            //수정할 글의 제목을 라우트 파라미터로 형식으로 저장
            res.send(template);
});
   
//글 쓰기 라우팅
app.get('/create', (req, res)=>{
    if(!req.user){
        res.redirect('/');
        return false;
    }
    fs.readdir('./page', function(err, filelist){
        const title = '글 쓰기 페이지';
        const list = templateObject.list(req.list);
        const data = `
        <form action="http://localhost:3000/process_create" method="post">
                <p>
                 <input type="text" name="title" placeholder="제목">
                </p>

                <p>
                     <textarea name="description" placeholder="본문"></textarea>
                 </p>

                 <p>
                    <input type="submit">
                </p>
            </form>
        `;
        const template = templateObject.html(title, list, data, "", authStatus(req,res));
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(template)
    })
});

//post 방식으로 데이터를 보냈을 때
app.post('/process_create', (req, res)=>{
    var postData = req.body;
    const title = postData.title;
    const description = postData.description;

        //fs.writeFile(`page/${title}`, description, 'utf-8', function(err){
            //res.redirect(encodeURI(`/page/${title}`));
        //})

        //db에 저장
        var topic = {id: shortid.generate(), title: title, des: description, user_id: req.user.id};
        db.get('topics').push(topic).write();
        res.redirect(`/page/${topic.id}`);
});

//글 수정 라우터
app.get('/update/:pageId', (req, res)=>{
    if(!req.user){
        res.redirect('/');
        return false;
    }
        fs.readdir('./page', function(err, filelist){
            fs.readFile(`page/${req.params.pageId}`, 'utf-8', function(err, fileData){

                const title = req.params.pageId; //수정하려는 글의 제목
                const list = templateObject.list(filelist);
                const data = `
                <form action="http://localhost:3000/process_update" method="post">
                    <p>
                        <!-- 수정 전 제목 전달 -->
                        <input type="hidden" name="id" value=${title}>
                        <input type="text" name="title" value=${title}>
                    </p>
                
                    <p>
                        <textarea name="description" placeholder="본문">${fileData}</textarea>
                    </p>
                
                    <p>
                        <input type="submit">
                    </p>
                        </form>
                `;
                const template = templateObject.html(title, list, data, `<a href="/page/{title}">글 수정</a>`, authStatus(req,res));
                //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                res.send(template)
            })
        })
})

app.post('/process_update', (req, res)=>{
    const postData = req.body;
    const title = postData.title;
    const description = postData.description;
    const id = postData.id
    //글 수정
    //1. 제목 변경
    fs.rename(`page/${id}`, `page/${title}`, function(err){
        //2. 본문 변경
        fs.writeFile(`page/${title}`, description, 'utf-8', function(err){
            //리다이렉션
            //res.writeHead(302, {Location: encodeURI(`/page/${title}`)});
            //res.end()

            res.redirect(`/page/${title}`)
        })
    })
})

app.post('/process_delete', (req, res)=>{
    if(!req.user){
        res.redirect('/');
        return false;
    }
    const postData = req.body;
    const id = postData.id 
    fs.unlink(`page/${id}`, function(){
        //파일 삭제가 끝나면 메인 화면으로 리다이렉션
        res.redirect('/');
    })
})

//라우트 파라미터 (userId)
app.get('/users/:userId/key/:keyId', (res, req)=>{
    res.send(`${req.params.userId} ${res.params.keyId}`);
})
app.get('/users/:userId');

app.get('/visit', (req, res)=>{
    res.send(`당신은 이 페이지를 ${req.session.views}번 방문함.`);
})

//로그인 라우트
app.get('/auth/login', (req, res)=>{
    const title = '로그인 페이지';
    const list = templateObject.list(req.list);
    const data = `
            <form action="http://localhost:3000/process_login" method="post">
                <input type="text" name="username" placeholder="username">
                <p>
                <input type="password" name="password" placeholder="password">
                </p>
                <p>
                <input type="submit" value="로그인">
                </p>
            </form>
    `
    const html = templateObject.html(title, list, data, '', authStatus(req,res));
    res.send(html);
})

//회원가입 라우트
app.get('/auth/register', (req, res)=>{
    const title = '회원가입 페이지';
    const list = templateObject.list(req.list);
    const data = `
            <form action="http://localhost:3000/process_register" method="post">
                <input type="text" name="username" placeholder="email">
                <p>
                <input type="password" name="password" placeholder="password">
                </p>
                <p>
                <input type="password" name="password2" placeholder="password 확인">
                </p>
                <p>
                <input type="text" name="displayName" placeholder="닉네임">
                <br><br>
                <input type="submit" value="회원가입">
                </p>
            </form>
    `
    const html = templateObject.html(title, list, data, '', authStatus(req,res));
    res.send(html);
})

app.post('/process_register', (req, res) => {
    const postData = req.body;
    const email = postData.username;
    const pwd = postData.password;
    const pwd2 = postData.password2;
    const displayName = postData.displayName;

    if(pwd !== pwd2){
        return res.redirect('/auth/register');
    }

    //db에 저장
    const user = {id: shortid.generate(), email: email, pwd: pwd, displayName: displayName};
    db.get('users').push(user).write();

    //회원가입 후 로그인
    req.logIn(user, (err)=>{
        return res.redirect('/');
    });
})


app.get('/auth/logout', (req, res)=>{
    req.session.destroy((err)=>{
        res.redirect('/');
    })
})

//404 Not Found 미들웨어
app.use((req, res, next)=>{
    res.status(404).send('404 NOT FOUND');
})

//진짜 에러 처리 미들웨어
app.use((err, req, res, next)=>{
    console.error(err.stack);
    res.status(500).send('에러에러에러');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

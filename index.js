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

const app = express()
const port = 3000

const authData = {
    email: 'ggm123@gh.com',
    password: '122333',
    nickName: '홍길동'
}

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
    console.log('SerializeUser: ', user); // user는 authData
    done(null, user.email);
})

passport.deserializeUser((id, done)=>{
    done(null, authData);
})

// passport 체계로 로그인 변경
app.post('/process_login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login'
}));

passport.use(new LocalStrategy(function verify(username, password, cb){
    console.log('Local: ', username, password);
    if(username === authData.email){
        if(password === authData.password){
            return cb(null, authData); //로그인 성공 시 사용자 데이터 전달
        }
        else{
            //로그인 실패
            return cb(null, false, {message: "비밀번호 틀림"});
        }
    }
    else{
        //로그인 실패
        return cb(null, false, {message: "없는 사용자 이메일"});
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
    //폴더 내 글 목록을 list에 저장
    fs.readdir('./page', function(err, filelist){
        req.list = filelist;
        next(); //req 데이터를 그대로 다음 미들웨어로 전달
    });
})

//정적 파일 미들웨어
app.use(express.static('public'));

//라우팅 --> path마다 응답
//메인 페이지
app.get('/', (req, res) => {
    //const queryData = url.parse(req.url, true).query;

    //파일 목록 불러오기
    
    const title = 'Welcome';
    const data = `첫 번째 페이지
    <p>
        <img src="/BMO.jpg" style="width:300px">
    </p>
    `;

    const list = templateObject.list(req.list);
    const template = templateObject.html(title, list, data, '', authStatus(req,res));

    //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    //res.end(template);

    //쿠키 전달
    res.cookie('myCookie', '홍길동');
    console.log(req.cookies);
    res.send(template); //writeHead + end
});

//목차 페이지 라우팅(라우트 파라미터 사용)
app.get('/page/:pageId', (req, res, next)=>{
    fs.readdir('./page', function(err, filelist)
    {
        fs.readFile(`page/${req.params.pageId}`, 'utf-8', function(err, data) //list를 data에 저장
        {
            if(err)
            {
                next(err); // 에러 처리 미들웨어로 전달
                return;
            }
            const title = req.params.pageId;
            const list = templateObject.list(req.list);
            const deleteForm =`
                <form action="/process_delete" method="post">
                <!-- 삭제할 글 제목 -->
                    <input type="hidden" name="id" value="${title}">
                        <input type="submit" value="delete">
                </form>
            `;
    
            const template = templateObject.html(title, list, data, `<a href="/update/${title}">글 수정</a> ${deleteForm}`, authStatus(req,res));
            // 수정할 글의 제목을 라우트 파라미터 형식으로 변경
    
            //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            //res.end(template); //저장한 데이터를 출력
    
            res.send(template);
        })
    })
});
   
//글 쓰기 라우팅
app.get('/create', (req, res)=>{
    if(!req.session.is_logined){
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
    /*let body = "";
    req.on('data', function(data){
        //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
        body += data;
    })

    req.on('end', function(){
        const postData = qs.parse(body);
        const title = postData.title;
        const description = postData.description;
    })*/

    //
    var postData = req.body;
    const title = postData.title;
    const description = postData.description;

        fs.writeFile(`page/${title}`, description, 'utf-8', function(err){
            //리다이렉션
            //res.writeHead(302, {Location: encodeURI(`/page/${title}`)});
            //res.end()
            //express 리다이렉션
            res.redirect(encodeURI(`/page/${title}`));
        })
});

//글 수정 라우터
app.get('/update/:pageId', (req, res)=>{
    if(!req.session.is_logined){
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
    //post 방식 데이터 받기
    /*let body = "";
    req.on('data', function(data){
        //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
        body += data;
    })
    req.on('end', function(){
        const postData = qs.parse(body);
        const title = postData.title;
        const description = postData.description;
        const id = postData.id //수정 전 제목

    })*/
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
    //post 방식 데이터 받기
    /*let body = "";
    req.on('data', function(data){
        //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
        body += data;
    })
    req.on('end', function(){
        const postData = qs.parse(body);
        const id = postData.id //삭제할 파일의 제목

        //글 삭제 (디렉토리에서 파일을 삭제)
    })*/
    if(!req.session.is_logined){
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

/*
app.post('/process_login', (req, res)=>{
    const postData = req.body;
    const email = postData.email;
    const password = postData.password;

    if(email === authData.email && password === authData.password)
    {
        //res.send('로그인 성공');
        //로그인 성공 => 닉네임, 로그인 여부를 세션에 저장
        req.session.is_logined = true;
        req.session.nickName = authData.nickName;
        req.session.save(()=>{
            res.redirect('/');
        })
    }
    else
    {
        res.send('로그인 실패');
    }
})
*/

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

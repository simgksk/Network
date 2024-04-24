//Express 메인 파일
const express = require('express')

const url = require('url');
const fs = require('fs');
const qs = require('querystring');
const templateObject = require('./lib/template.js');

const app = express()
const port = 3000

//라우팅 --> path마다 응답
//메인 페이지
app.get('/', (req, res) => {

    //const queryData = url.parse(req.url, true).query;

    //파일 목록 불러오기
    fs.readdir('./page', function(err, filelist)
    {
        const title = 'Welcome';
        const data = '첫 번째 페이지';

        const list = templateObject.list(filelist);
        const template = templateObject.html(title, list, data, '');

        //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        //res.end(template);

        res.send(template); //writeHead + end
    })
});

//목차 페이지 라우팅(라우트 파라미터 사용)
app.get('/page/:pageId', (req, res)=>{

    fs.readdir('./page', function(err, filelist)
    {
        fs.readFile(`page/${req.params.pageId}`, 'utf-8', function(err, data) //list를 data에 저장
        {
            const title = req.params.pageId;
            const list = templateObject.list(filelist);
            const deleteForm =`
                <form action="process_delete" method="post">
                <!-- 삭제할 글 제목 -->
                    <input type="hidden" name="id" value="${title}">
                        <input type="submit" value="delete">
                </form>
            `;
    
            const template = templateObject.html(title, list, data, `<a href="update?id=${title}">글 수정</a> ${deleteForm}`);
    
            //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            //res.end(template); //저장한 데이터를 출력
    
            res.send(template);
        })
    })
});
   
//글 쓰기 라우팅
app.get('/create', (req, res)=>{
    fs.readdir('./page', function(err, filelist){
        const title = '글 쓰기 페이지';
        const list = templateObject.list(filelist);
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
        const template = templateObject.html(title, list, data, "");
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(template)
    })
});

//post 방식으로 데이터를 보냈을 때
app.post('/process_create', (req, res)=>{
    let body = "";
    req.on('data', function(data){
        //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
        body += data;
    })

    req.on('end', function(){
        const postData = qs.parse(body);
        const title = postData.title;
        const description = postData.description;
        fs.writeFile(`page/${title}`, description, 'utf-8', function(err){
            //리다이렉션
            //res.writeHead(302, {Location: encodeURI(`/page/${title}`)});
            //res.end()
            //express 리다이렉션
            res.redirect(encodeURI(`/page/${title}`));
        })
    })
});

//라우트 파라미터 (userId)
app.get('/users/:userId/key/:keyId', (res, req)=>{
    res.send(`${req.params.userId} ${res.params.keyId}`);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

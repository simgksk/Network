const { error } = require('console');
var http = require('http');
var url = require('url');
var fs = require('fs');
var qs = require('querystring');
var templateObject = require('./lib/template.js');

var app = http.createServer(function(req, res) //app: 서버의 객체 req: 요청한 내용이 담겨있음.(url) / res: 응답, 화면에 뜨는 모든 것
{
    var queryData = url.parse(req.url, true).query;
    var pathName = url.parse(req.url, true).pathname;

    var urlPath = req.url; //주소창에 입력한 주소 ex) /index.html 
    var title = queryData.id;

    if(pathName == '/')
    {
        // 메인페이지 (localhost: 3000)
        if(queryData.id == undefined) // 쿼리 데이터가 없을 때
        {
            //파일 목록 불러오기
            fs.readdir('./page', function(err, filelist)
            {
                var title = 'Welcome';
                var data = '첫 번째 페이지';

                var list = templateObject.list(filelist);
                var template = templateObject.html(title, list, data, '');
    
                res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                res.end(template);
            })
        }
            // 목차 페이지
        else
        {
            fs.readdir('./page', function(err, filelist)
            {
                fs.readFile(`page/${title}`, 'utf-8', function(err, data) //list를 data에 저장
                {
                    var title = queryData.id;

                    var list = templateObject.list(filelist);
                    var deleteForm =`
                        <form action="process_delete" method="post">
                        <!-- 삭제할 글 제목 -->
                            <input type="hidden" name="id" value="${title}">
                            <input type="submit" value="delete">
                        </form>
                    `;

                    var template = templateObject.html(title, list, data, `<a href="update?id=${title}">글 수정</a> ${deleteForm}`);

                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end(template); //저장한 데이터를 출력
                });
            })
        }
    }

    else if(pathName=='/hahaha')
    {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end('hahahahohoho'); //end는 꼭 있어야함.
    }

    else if(pathName == '/create')
    {
        fs.readdir('./page', function(err, filelist){
            var title = '글 쓰기 페이지';
            var list = templateObject.list(filelist);
            var data = `
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
            var template = templateObject.html(title, list, data, "");
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(template)
        })
    }

    else if(pathName == "/process_create")
    {
        //post 방식 데이터 받기
        var body = "";
        req.on('data', function(data){
            //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
            body += data;
        })
        req.on('end', function(){
            var postData = qs.parse(body);
            var title = postData.title;
            var description = postData.description;

            fs.writeFile(`page/${title}`, description, 'utf-8', function(err){
                res.writeHead(302, {Location: encodeURI(`/?id=${title}`)});
                res.end()
            })
        })
    }

    else if(pathName == "/update")
    {
        fs.readdir('./page', function(err, filelist){
            fs.readFile(`page/${queryData.id}`, 'utf-8', function(err, fileData){

                var title = queryData.id; //수정하려는 글의 제목
                var list = templateObject.list(filelist);
                var data = `
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
                var template = templateObject.html(title, list, data, `<a href="/update?id=${title}">글 수정</a>`);
                res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                res.end(template)
            })
        })
    }

    //글 수정
    else if(pathName == "/process_update")
    {
        //post 방식 데이터 받기
        var body = "";
        req.on('data', function(data){
            //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
            body += data;
        })
        req.on('end', function(){
            var postData = qs.parse(body);
            var title = postData.title;
            var description = postData.description;
            var id = postData.id //수정 전 제목

            //글 수정
            //1. 제목 변경
            fs.rename(`page/${id}`, `page/${title}`, function(err){
                //2. 본문 변경
                fs.writeFile(`page/${title}`, description, 'utf-8', function(err){
                    //리다이렉션
                    res.writeHead(302, {Location: encodeURI(`/?id=${title}`)});
                    res.end()
                })
            })
        })
    }

    else if(pathName == "/process_delete")
    {
        //post 방식 데이터 받기
        var body = "";
        req.on('data', function(data){
            //특정한 크기의 데이터를 수신할 때마다 콜백 함수 호출
            body += data;
        })
        req.on('end', function(){
            var postData = qs.parse(body);
            var id = postData.id //삭제할 파일의 제목

            //글 삭제 (디렉토리에서 파일을 삭제)
            fs.unlink(`page/${id}`, function(){
                //파일 삭제가 끝나면 메인 화면으로 리다이렉션
                res.writeHead(302, {Location:'/'});
                res.end();
            })
        })
    }
        
    //404
    else
    {
        res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
        res.end('404 Not Found 돌아가십숑숑숑');
    }

});
app.listen(3000); //서버를 3000번 포트에 연다.

app.on('listening', ()=>{
    console.log('3000번 포트에서 서버 실행 중')
});

app.on('error', (error)=>{
    console.error(error);
});

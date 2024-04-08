const { error } = require('console');
var http = require('http');
var url = require('url');
var fs = require('fs');
var qs = require('querystring');

//템플릿 함수화
function templateHTML(title, list, data, control){
    return `
                <!DOCTYPE html>
                <html lang="kr">
                <head>
                    <meta charset="UTF-8">
                    <title>Web-204 ${title}</title>
                </head>
                <body>
                <!-- 주석, 제목 눌렀을 때 메인 페이지로 -->
                    <h1><a href="/">${title}</a></h1> 
                    <h2>${title} 시간표</h2>
                    ${list}
                    <a href="/create">글 쓰기</a>
                    ${control}
                    <p> 
                        ${data}
                    </p>
                
                </body>
                </html>
            `;
}

function templateList(filelist){
    //list 변수 생성
    var list = '<ol>'; // <ol> 태그로 시작
    var i = 0;

    while(i<filelist.length)
    {
        list += `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
        i += 1;
    };
    list += '</ol>';

    return list;
}

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

                var list = templateList(filelist);
                var template = templateHTML(title, list, data, '');
    
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

                    var list = templateList(filelist);
                    var template = templateHTML(title, list, data, `<a href="update?id=${title}">글 수정</a>`);

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
            var list = templateList(filelist);
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
            var template = templateHTML(title, list, data, "");
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
            var title = queryData.id; //수정하려는 글의 제목
            var list = templateList(filelist);
            var data = `
            <form action="http://localhost:3000/process_update" method="post">
                <p>
                <!-- 수정 전 제목 전달 -->
                    <input type="hidden" name="id" value=${title}>
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
            var template = templateHTML(title, list, data, `<a href="/update?id=${title}">글 수정</a>`);
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(template)
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

const { error } = require('console');
var http = require('http');
var url = require('url');
var fs = require('fs');

var app = http.createServer(function(req, res) //app: 서버의 객체 req: 요청 res: 응답
{
    var queryData = url.parse(req.url, true).query;
    var urlPath = req.url; //주소창에 입력한 주소 ex) /index.html 
    var template = `
    <!DOCTYPE html>
    <html lang="kr">
    <head>
        <meta charset="UTF-8">
        <title>Web-204 ${queryData.id}</title>
    </head>
    <body>
        <h1><a href="index.html">${queryData.id}시간표</a></h1> 
        <h2>${queryData.id} 시간표</h2>
    
        <ol>
            <li><a href="list1.html">1교시</a></li>
            <li><a href="list2.html">2교시</a></li>
            <li><a href="list3.html">3교시</a></li>
        </ol>
    
    </body>
    </html>
    `;

    if(req.url == '/') //메인 페이지(루트 주소)
    {
        urlPath = '/index.html';
    }
    else if(req.url == '/favicon.ico')
    {
        return res.writeHead(404);
    }

    //console.log(queryData);

    //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); //오타나면 정보 전달이 제대로 되지 않음, 없으면 글자가 깨짐, 한 번만 써야함.
    //res.write('<h1>바보</h1>'); //여러번 작성 가능
    //res.end(fs.readFileSync('index.html')); //없으면 무한 로딩에 걸림, 한 번만 작성해야 함.

    //res.writeHead(200, {'Content-Type': 'image/jpeg; charset=utf-8'});
    //res.end(fs.readFileSync('home.jpg'));

    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    //res.end(fs.readFileSync('index.html'));

    //res.end(fs.readFileSync(__dirname+urlPath)); //요청한 url이 전달되면서 디렉토리에서 파일을 읽어와 응답
    //console.log(__dirname+urlPath);

    res.end(template);
});
app.listen(3000); //서버를 3000번 포트에 연다.

app.on('listening', ()=>{
    console.log('3000번 포트에서 서버 실행 중')
});

app.on('error', (error)=>{
    console.error(error);
});

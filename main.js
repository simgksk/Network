const { error } = require('console');
var http = require('http');
var url = require('url');
var fs = require('fs');

var app = http.createServer(function(req, res) //app: 서버의 객체 req: 요청 res: 응답
{
    var queryData = url.parse(req.url, true).query;
    console.log(queryData);

    //res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); //오타나면 정보 전달이 제대로 되지 않음, 없으면 글자가 깨짐, 한 번만 써야함.
    res.writeHead(200, {'Content-Type': 'image/jpeg; charset=utf-8'});
    //res.write('<h1>바보</h1>'); //여러번 작성 가능
    //res.end(fs.readFileSync('index.html')); //없으면 무한 로딩에 걸림, 한 번만 작성해야 함.
    res.end(fs.readFileSync('home.jpg'));
});
app.listen(3000); //서버를 3000번 포트에 연다.

app.on('listening', ()=>{
    console.log('3000번 포트에서 서버 실행 중')
});

app.on('error', (error)=>{
    console.error(error);
});

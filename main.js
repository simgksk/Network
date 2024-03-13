var http = require('http');
var app = http.createServer(function(req, res)
{
    res.end('Hello World!');
});
app.listen(3000);

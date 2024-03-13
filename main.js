var http = require('http');
var url = require('url');
var app = http.createServer(function(req, res)
{
    var queryData = url.parse(req.url, true).query;
    console.log(queryData);
    res.end(queryData.id);
});
app.listen(3000);

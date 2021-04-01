// this is a testing http server, to test the reverse proxy
var http = require('http');
var server = http.createServer(function(req,res) {
    res.write("server1, port 9000");
    res.end();
});

var server2 = http.createServer(function(req,res) {
    res.write("server2, port 9001");
    res.end();
});

server.listen(9000);
server2.listen(9001);
console.log("test server running")
var http = require("http")
var fs = require("fs")
var mustache = require('mustache');
var qs = require('querystring');
const crypto = require('crypto');
const title = 'fingerprintattendance';
var creds = require("./creds.js")

var port = 3000;



var server = http.createServer(function(req,res){


	if (req.method == "GET") {

		if (req.url == "/") {
			console.log("Hit")
			
			var stream = fs.createReadStream("./index.html")

			stream.pipe(res)
			stream.on("open",function(){
				res.writeHead(200)

			})
			stream.on("close",function(){
				res.end()				
			})
		}
		if (req.url.split("/")[1] === "profile") {

			console.log(req.url.split("/"));

			fs.readFile('./profile.html', 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
					
				// var s_index = req.url.split("/")[2];
				// var sessionid = req.url.split("/")[parseInt(s_index)+3]
				// console.log(s_index,sessionid)
				var cookies = parseCookies(req);
				var sessionid = cookies.APIv;

				console.log(cookies);

				var faculty = null;

				creds.forEach(function(cred){

					if (cred.sessionid == sessionid) {
						faculty = cred						
					}

				})
				sessionid = 0;

				var html = 'Incorrect Userid or Password! ';



				if (faculty !== null && faculty.ipaddr == req.connection.remoteAddress) {
					html = mustache.to_html(data, faculty);
				}

				res.end(html);

			})
			
		}
		else {

			var urlSplit = req.url.split(".")

			var extention = urlSplit[urlSplit.length-1];

			if (extention == 'png' || 
				extention == 'jpg' ||
				extention == 'jpeg') {

					var img ;
					

					try {
					 	img = fs.readFileSync('.'+req.url);
					 	res.writeHead(200, {'Content-Type': 'image/'+extention });
						res.end(img, 'binary');	
					} catch (err) {
						res.end("404 - resource not found");
						//throw err;
					  // Here you get the error when the file was not found,
					  // but you also get any other error
					}
					
						
					

					
			}
		}		
	}

	else if( req.method == "POST"){

		if (req.url == "/login") {

			var body = '';

        	req.on('data', function (data) {
	            body += data;

	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (body.length > 1e6)
	                req.connection.destroy();
	        });

			req.on('end', function () {
	            var post = qs.parse(body);

	            console.log(post)

	            creds.forEach(function(cred){
	            	if (cred.username == post.username
	            		&& cred.password == post.password) {

	            		
	            		var sessionid_t = crypto.createHmac('sha256', title).update(parseInt(Math.random()*100000).toString()).digest('hex');
	            		var salt1 = crypto.createHmac('sha256', title).update(parseInt(Math.random()*100000).toString()).digest('hex');
	            		var salt2 = crypto.createHmac('sha256', title).update(parseInt(Math.random()*100000).toString()).digest('hex');
	   
	            		cred.sessionid = sessionid_t;
	            		cred.logged = 1;
	            		cred.ipaddr = req.connection.remoteAddress;

	            		//console.log(creds,"Logged In");

	            		res.writeHead(302, 
	            			{ 	'Set-Cookie': ['APIv='+sessionid_t,"browserRev="+salt1,"HSID="+salt2],
	            				"Location": "http://" + req.headers['host'] + '/profile' });

	            	}
	            })

	            res.end("Incorrect Userid or password !");
	        });
			
		}
	}
}).listen(port,function(){ console.log("Listening at ",port)})





function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}
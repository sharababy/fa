var http = require("http")
var fs = require("fs")
var mustache = require('mustache');
var qs = require('querystring');
const crypto = require('crypto');
const title = 'fingerprintattendance';
var creds = require("./creds.js")
var sqlite3 = require('sqlite3').verbose();

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
		else if (req.url.split("/")[1] === "profile") {

			console.log("Profile Page Accessed ",req.url);

			fs.readFile('./profile.html', 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
					
				// var s_index = req.url.split("/")[2];
				// var sessionid = req.url.split("/")[parseInt(s_index)+3]
				// console.log(s_index,sessionid)
				var cookies = parseCookies(req);
				var sessionid = cookies.APIv;

				//console.log(cookies);

				var faculty = null;

				creds.forEach(function(cred){

					if (cred.sessionid == sessionid) {
						faculty = cred						
					}

				})
				sessionid = 0;

				var html = 'Please Login Again - Session Expired';

				if (faculty !== null && 
					faculty.ipaddr == req.connection.remoteAddress &&
					faculty.logged == 1) {
					html = mustache.to_html(data, faculty);
				}

				res.end(html);

			})
			
		}

		else if (	req.url.split("/")[1] === "course" &&
					req.url.split("/").length === 3
				) {

			console.log("Course Page Accessed ",req.url);

			fs.readFile('./course.html', 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
					
				// var s_index = req.url.split("/")[2];
				// var sessionid = req.url.split("/")[parseInt(s_index)+3]
				// console.log(s_index,sessionid)
				var cookies = parseCookies(req);
				var sessionid = cookies.APIv;

				////console.log(cookies);

				var faculty = null;
				var course = [],atten = [];

				creds.forEach(function(cred){

					if (cred.sessionid == sessionid) {
						faculty = cred						
					}

				})
				sessionid = 0;

				var html = 'Please Login Again - Session Expired';

				if (faculty !== null && 
					faculty.ipaddr == req.connection.remoteAddress &&
					faculty.logged == 1) {
					// get attendance data from sqlite
					var db = new sqlite3.Database('./attendance.db');

					db.serialize(function() {
						
						query = `select 
									count(a.studentid) as attendance,
									s.roll as roll, 
									s.name as name,
									c.name as classname,
									c.classcount as cc
								from 
									attendance3 as a,
									student as s,
									class as c  
								where 
									a.studentid=s.id and 
									a.courseid=c.id and 
									c.cno = ? 
									group by s.name
									order by s.roll;`

						db.all(query,req.url.split("/")[2],
							function(err,rows){
								console.log(rows)
								
								html = mustache.to_html(data,
													{classname:rows[0].classname,
													cc:rows[0].cc,
													d:rows,
													apercent: function(text){ 
														at = parseInt((parseInt(this.attendance)/parseInt(this.cc))*10000)/100 
														return at
													}
												});	
								if(rows === []){
									html = "No such course"
								}
								res.end(html);
								
							})

						
							

							
						
					});

					db.close();

					
				}
				else{
					res.end("Please login again !");
				}				

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
						res.writeHead(404);
						res.end("404 - resource not found");
						//throw err;
					  // Here you get the error when the file was not found,
					  // but you also get any other error
					}					
			}
			else{
				res.writeHead(404);
				res.end("404 - Page not found !")
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

	            //console.log(post)

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
		else if (req.url == '/newAttendanceFile') {

			var body = '';

        	req.on('data', function (data) {
	            body += data;

	            // Too much POST data, kill the connection!
	            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
	            if (body.length > 1e9)
	                req.connection.destroy();
	        });

			req.on('end', function () {
	        	var post = qs.parse(body);

				var year = post.year;
				var dstr = post.data;
				var cstr = post.courses;
				var fstr = post.faculty;
				var sstr = post.students;
				//console.log(post)


				dstr = dstr.split("(").join("[")
				dstr = dstr.split(")").join("]")

				cstr = cstr.split("(").join("[")
				cstr = cstr.split(")").join("]")
				cstr = cstr.split("u'").join("'")
				cstr = cstr.split(`'`).join(`"`)

				fstr = fstr.split("(").join("[")
				fstr = fstr.split(")").join("]")
				fstr = fstr.split("u'").join("'")
				fstr = fstr.split(`'`).join(`"`)

				sstr = sstr.split("(").join("[")
				sstr = sstr.split(")").join("]")
				sstr = sstr.split("u'").join("'")
				sstr = sstr.split(`'`).join(`"`)

				var data 	 = JSON.parse(dstr);
				var courses  = JSON.parse(cstr);
				var faculty  = JSON.parse(fstr);
				var students = JSON.parse(sstr);

				// console.log(data)
				// console.log(courses)
				// console.log(faculty)
				// console.log(students)
				var db = new sqlite3.Database('./attendance.db');

				db.serialize(function(){

					var stmt = db.prepare(`INSERT INTO attendance`+year+` VALUES(:studentid,:courseid,:day,:month,:year,:syncstatus)`);
						
					// stmt.run();

					console.log(data[27])

					data.forEach(function(d,i){
						
						query = `select 
									* from 'attendance3'
								where 
									studentid = ? and
									courseid = ? and
									day = ? and
									month = ? and
									year = ?;`	

						db.all(query,[d[0],d[1],d[2],d[3],d[4]],
							function(err,rows){
								if (err) {console.log(err)}
							
								if(rows.length == 0){
									var placeholders = {
									    $studentid:d[0],
									    $courseid:d[1],
									    $day:d[2],
									    $month:d[3],
									    $year:d[4],
									    $syncstatus:d[5]
									};
									console.log("HIT ")
									console.log(d)

									var q = `INSERT INTO attendance`+year+`(studentid,courseid,day,month,year,syncstatus) VALUES(?,?,?,?,?,?)`
									db.run(q,	d);	

								}
							})
						
						if (i == data.length-1) {
							stmt.finalize();
						}

					});	

					stmt = db.prepare("INSERT INTO 'faculty' (name,sha) VALUES (?,?)");					
					faculty.forEach(function(d,i){
						
						query = `select 
									* from faculty 
								where 
									id = ?;`	

						db.all(query,[d[0]],
								function(err,rows){
									if (err) {console.log(err)}
							if(rows.length == 0){
								
								console.log("HIT ")
								stmt.run(d[1],d[2]);	

							}
						})		
						
						if (i == faculty.length) {
							stmt.finalize();
						}

					});

					stmt = db.prepare("INSERT INTO 'class' (cno,classcount,name,facultyid) VALUES (?,?,?,?)");					
					courses.forEach(function(d,i){
						
						query = `select 
									* from class 
								where 
									id = ?;`	

						db.all(query,[d[0]],
								function(err,rows){
									if (err) {console.log(err)}
							if(rows.length == 0){
								
								console.log("HIT ")
								stmt.run(d[1],d[2],d[3],d[4]);	

							}
						})		
						
						if (i == courses.length) {
							stmt.finalize();
							// db.close();
						}

					});

					stmt = db.prepare(`INSERT INTO 'student' (sha,name,roll) VALUES (:sha,:name,:roll)`);					
					students.forEach(function(d,i){
						
						query = `select 
									* from student 
								where 
									id = ?;`	

						db.all(query,[d[0]],
								function(err,rows){
									if (err) {console.log(err)}
							if(rows.length == 0){
								
								console.log("HIT ")
								stmt.run(d[1],d[2],d[3]);	

							}
						})		
						
						if (i == students.length) {
							stmt.finalize();
							db.close();
						}

					});

				})
				

				res.end();
		            
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
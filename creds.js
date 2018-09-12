//creds.js

var creds = [
	{
		name:"Dr. Naveen Kumar",
		username:"naveen",

		password:"123",
		logged:0,
		sessionid:0,
		ipaddr:"0.0.0.0",

		post:"Associate Professor",
		courses:[
			{name:"Product Design Practice",cno:"COM123T"},
			{name:"Engineering Physics", cno:"COM101T"}
		],
		cno_f: function(){
			return this.cno
		},
		cno_n: function(){
			return this.name
		}
	},
	{
		name:"Tapas Sil",
		username:"tapas",
		
		password:"123",
		logged:0,
		sessionid:0,
		ipaddr:"0.0.0.0",

		post:"Associate Professor",
		courses:[
			{name:"Product Design Practice",cno:"DES310T"},
			{name:"Engineering Physics", cno:"COM101T"},
			{name:"Test Course 1", cno:"COM111T"},
			{name:"Test Course 2", cno:"123"}
		],
		cno_f: function(){
			return this.cno
		},
		cno_n: function(){
			return this.name
		}
	},
	{
		name:"Sadagopan",
		username:"sadagopan",
		
		password:"123",
		logged:0,
		sessionid:0,
		ipaddr:"0.0.0.0",

		post:"Assistant Professor",
		courses:[
			{name:"Product Design Practice",cno:"COM123T"},
			{name:"Engineering Physics", cno:"COM101T"}
		],
		cno_f: function(){
			return this.cno
		},
		cno_n: function(){
			return this.name
		}
	},
	{
		name:"B Sivaselvan",
		username:"bss",
		
		password:"123",
		logged:0,
		sessionid:0,
		ipaddr:"0.0.0.0",

		post:"Assistant Professor",
		courses:[
			{name:"Operating Systems",cno:"COM123T"},
			{name:"Database Management Systems", cno:"COM101T"},
		],
		cno_f: function(){
			return this.cno
		},
		cno_n: function(){
			return this.name
		}
	}
]


module.exports = creds;
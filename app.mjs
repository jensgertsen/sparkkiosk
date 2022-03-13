import fs from 'fs';
import crypto from "crypto";
import express from "express";
import sqlite from "better-sqlite3";
import expressession from "express-session";
import Database from 'better-sqlite3';
import sessionStore from "better-express-store";
import path from 'path';
import {fileURLToPath} from 'url';
import { bech32, bech32m } from 'bech32';
import bodyParser from 'body-parser';
import url from 'url';
import config from 'config';

import {verifyinvoices} from './verifyinvoices.mjs';
import {lnsubscribe} from './lnsubscribe.mjs';
import {lnurlstep1} from './lnurlstep1.mjs';
import {lnurlstep2} from './lnurlstep2.mjs';

let doInit = true;
let adminPassword = process.env.APP_PASSWORD;

const PORT = config.get("port");

var serviceUrl = config.get("serviceUrl");
if(serviceUrl ==""){
	serviceUrl = process.env.APP_HIDDEN_SERVICE;
}


let lndCredentials = {
	macaroon: fs.readFileSync(process.env.LND_GRPC_MACAROON).toString('hex'),
	cert:fs.readFileSync(process.env.LND_GRPC_CERT),
	lndEndpoint:process.env.LND_GRPC_ENDPOINT,
	lndPort:process.env.LND_GRPC_PORT
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDb = new Database(config.get("applicationDatabase"));
appDb.prepare("CREATE TABLE IF NOT EXISTS settings(id text,currency text,mailsubject text,mailtext text,sendmails text,mailersend_apikey text,mailersend_template text,adminemail text);").run();
appDb.prepare("CREATE TABLE IF NOT EXISTS invoice(id text,datecreated text,dateissued text,value integer,expiry integer,memo text,r_hash text,lnurl text,status text,amount integer,currency text, comment text);").run();
appDb.prepare("CREATE TABLE IF NOT EXISTS lnurl(id text,datecreated text,description text,invoice text,amount integer,currency text,status text);").run();
const settingsExist = appDb.prepare("SELECT count(id) as count FROM settings WHERE id='default';").get();
if(settingsExist.count==0){
	appDb.prepare("INSERT INTO settings (id) VALUES('default')").run();
}

const app = express();




let session = expressession;

app.use(
  session({
    store: sessionStore({  
		dbPath: config.get("sessionsDatabase"),
	  	deleteAfterInactivityMinutes: 120}),
    secret: "A827B1B4-453D-3E96-0F4A-E52BE026E4FF",
	saveUninitialized: true,
	cookie: {secure: 'auto', maxAge: 1000*60*60},
	rolling: true,
	resave: true,
  })
)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/js', express.static(__dirname + '/js'));






app.get('/',(req,res) => {
    session=req.session;
	if(session.auth){
		res.sendFile("dashboard.html",{root:__dirname});
    }
	else{
		res.sendFile("index.html",{root:__dirname});
	}
});

app.get('/dashboard',(req,res) => {
	if(req.session.auth){
		res.sendFile("dashboard.html",{root:__dirname});
    }
    else{
		res.sendFile("index.html",{root:__dirname});
    }
})


//LNURL endpoints
//=================================================================================

//step1
app.get('/lnurl/:id',(req,res) => {
	lnurlstep1(sanitize(req.params.id),res);
})
//step2
app.get('/invoice/',(req,res) => {
	var id = sanitize((url.parse(req.url, true).query).id);
	var comment = sanitize((url.parse(req.url, true).query).comment);
	lnurlstep2(id, comment,res,lndCredentials);
})




//ajax endpoints
//=================================================================================
app.post('/dologin',(req,res) => {
   	req.session.auth = false;
	if(req.body.password == adminPassword){
		req.session.auth = true;
    }
	let loginStatus = {
		auth: req.session.auth, 
	}
 	res.setHeader('Content-Type', 'application/json');
  	res.send(loginStatus);
})

app.get('/dologout',(req,res) => {
	req.session.auth = false;
	req.session.destroy();
	let loginStatus = {
		auth: false, 
	}
 	res.setHeader('Content-Type', 'application/json');
  	res.send(loginStatus);
});

app.get('/getlnurls',(req,res) => {
    if(req.session.auth){
		const data = appDb.prepare("SELECT * FROM lnurl WHERE status='active' ORDER BY datecreated DESC;").all();
		//inject bech32 encoded url
		data.forEach(function(lnu) {
			let words = bech32.toWords(Buffer.from(serviceUrl+'/lnurl/'+lnu.id, 'utf8'));
			var currentEncoded = bech32.encode('LNURL', words, 256);
			lnu.qrpayload = "LIGHTNING:" + currentEncoded.toUpperCase();
			//inject latest invoices
			const invoices = appDb.prepare("SELECT * FROM invoice WHERE lnurl=? ORDER BY datecreated DESC LIMIT 10;").all(lnu.id);
			lnu.invoices = invoices;
		});
		res.setHeader('Content-Type', 'application/json');
	  	res.send(data);
    }
    else{
		let loginStatus = {
			auth: false, 
		}
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(loginStatus);
	}
})

app.get('/getinvoices',(req,res) => {
    if(req.session.auth){
		const data = appDb.prepare("SELECT * FROM invoice ORDER BY datecreated DESC;").all();
		res.setHeader('Content-Type', 'application/json');
	  	res.send(data);
    }
    else{
		let loginStatus = {
			auth: false, 
		}
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(loginStatus);
	}
})


app.post('/createlnurl',(req,res) => {
    if(req.session.auth){
		var id =crypto.randomBytes(16).toString("hex");
		var description =  sanitize(req.body.description);
		var amount =  sanitize(req.body.amount);
		var currency =  sanitize(req.body.currency);
		
		const data = appDb.prepare("INSERT INTO lnurl (id,datecreated,description,amount,currency,status,invoice) VALUES (?,CURRENT_TIMESTAMP,?,?,?,'active','');").run(id,description,amount,currency);
		let createStatus = {update: true};
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(createStatus);
    }
    else{
		let loginStatus = {auth: false};
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(loginStatus);
	}
})

app.put('/archive/:id',(req,res) => {
	if(req.session.auth){
		var id =  sanitize(req.params.id);
		const data = appDb.prepare("UPDATE lnurl set status='archived' WHERE id=?").run(id);
		let createStatus = {update: true};
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(createStatus);
    }
    else{
		let loginStatus = {auth: false};
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(loginStatus);
	}
})

app.get('/settings',(req,res) => {
    if(req.session.auth){
		const data = appDb.prepare("SELECT * FROM settings WHERE id='default';").get();
		res.setHeader('Content-Type', 'application/json');
	  	res.send(data);
    }
    else{
		let loginStatus = {
			auth: false, 
		}
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(loginStatus);
	}
})

app.post('/settings',(req,res) => {
    if(req.session.auth){
	
		var mailsubject = sanitize(req.body.mailsubject);
		var mailtext = sanitize(req.body.mailtext);
		var currency = sanitize(req.body.currency);
		var sendmails = sanitize(req.body.sendmail);
		var mailersend_apikey = sanitize(req.body.mailersend_apikey);
		var mailersend_template = sanitize(req.body.mailersend_template);
		var adminemail = sanitize(req.body.adminemail);
		
		const data = appDb.prepare("UPDATE settings SET mailsubject =?,mailtext =?,currency =?,sendmails =?,mailersend_apikey =?,mailersend_template =?,adminemail =? WHERE id='default';").run(mailsubject,mailtext,currency,sendmails,mailersend_apikey,mailersend_template,adminemail);
		
		let createStatus = {update: true};
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(createStatus);
    }
    else{
		let loginStatus = {auth: false};
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(loginStatus);
	}
})


//INIT VERIFY INVOICE STATUS
//=================================================================================
if(doInit){
	verifyinvoices(lndCredentials);
	doInit = false;
}

//LND INVOICE SUBSCRIBE
//=================================================================================
lnsubscribe(lndCredentials);


app.listen(PORT, () => console.log("Sparkkiosk running at: " + serviceUrl));

function sanitize(strIn) {
	var strOut = "";
	if(strIn != undefined && strIn != ""){
		const map = {
	      '&': '&amp;',
	      '<': '&lt;',
	      '>': '&gt;',
	      '"': '&quot;',
	      "'": '&#x27;',
	      "/": '&#x2F;',
		};
		const reg = /[&<>"'/]/ig;
	 	strOut= strIn.replace(reg, (match)=>(map[match]));
	}
	return strOut;
}
import express from "express";
import sqlite from "better-sqlite3";
import expressession from "express-session";
import Database from 'better-sqlite3';
import sessionStore from "better-express-store";

const app = express();


let session = expressession;

app.use(
  session({
    store: sessionStore({  
		dbPath: "data/sessions.db",
	  	deleteAfterInactivityMinutes: 120}),
    secret: "A827B1B4-453D-3E96-0F4A-E52BE026E4FF",
	saveUninitialized: true,
	cookie: {secure: 'auto', maxAge: 1000*60*60},
	rolling: true,
	resave: true,
  })
)

const appDb = new Database("data/sparkkiosk.db");
appDb.prepare("CREATE TABLE IF NOT EXISTS settings(id text,currency text,mailsubject text,mailtext text,sendmails text,mailersend_apikey text,mailersend_template text,adminemail text);").run();
appDb.prepare("CREATE TABLE IF NOT EXISTS invoice(id text,datecreated text,value integer,expiry integer,memo text,r_hash text,lnurl text,status text,amount integer,currency text, comment text);").run();
appDb.prepare("CREATE TABLE IF NOT EXISTS lnurl(id text,datecreated text,description text,invoice text,amount integer,currency text,status text,encodedurl text);").run();
const settingsExist = appDb.prepare("SELECT count(id) as count FROM settings WHERE id='default';").get();
if(settingsExist.count==0){
	console.log("INSERTING SETTINGS");
	appDb.prepare("INSERT INTO settings (id) VALUES('default')").run();

}

console.log(settingsExist.count);
console.log(JSON.stringify(settingsExist));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));






app.get('/',(req,res) => {
    session=req.session;
	console.log("ENDPOINT / auth: "+ session.auth);
    if(session.auth){
		res.sendFile("dashboard.html",{root:__dirname});
    }
	else{
		res.sendFile("index.html",{root:__dirname});
	}
});





//ajax endpoints
//=================================================================================
app.post('/dologin',(req,res) => {
   	req.session.auth = false;
	console.log("DOLOGIN "+req.body.password + " / ");
	if(req.body.password == "7"){
		console.log("DOLOGIN TRUE");
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



app.listen("21214", () => console.log('Server Running at port: '));
import fetch from 'node-fetch';
import Database from 'better-sqlite3';
import crypto from "crypto";
import config from 'config';

const appDb = new Database(config.get("applicationDatabase"));

const invoiceExpiry = config.get("invoiceExpiry");
var serviceUrl = config.get("serviceUrl");
if(serviceUrl ==""){
	serviceUrl = process.env.APP_HIDDEN_SERVICE;
}

async function lnurlstep1(id,res){
	const dataDb = appDb.prepare("SELECT * FROM lnurl WHERE id=?;").get(id);
	if(dataDb!=undefined){
		var lnurlId = dataDb.id;
		var amount = dataDb.amount;
		var currency = dataDb.currency;
		var description = dataDb.description;
		var coingeckoURL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency="+currency+"&ids=bitcoin";
		const response = await fetch(coingeckoURL);
		const data = await response.json();
		var rate = data[0].current_price;
	  	var satAmount = amount * (Math.floor(100000000000/rate));
		satAmount = (parseInt(satAmount/1000))*1000;
		var id =crypto.randomBytes(16).toString("hex");
		const dataUpdate = appDb.prepare("INSERT INTO invoice (id,datecreated,value,expiry,memo,r_hash,lnurl,status,amount,currency) VALUES (?,CURRENT_TIMESTAMP,?,?,?,'',?,'NEW',?,?);").run(id,satAmount,invoiceExpiry,description,lnurlId,amount,currency);
		let lnurl = {
		    callback: serviceUrl+"/invoice/?id="+id,
		    maxSendable: satAmount,
		    minSendable: satAmount,
		    metadata: "[[\"text/plain\", \""+ description +"\"]]",
			commentAllowed: 256,
		    tag: "payRequest"
		}
	 	res.setHeader('Content-Type', 'application/json');
	  	res.send(lnurl);
	}
	else{
		let lnurl = {
		    status: "ERROR",
		    reason: "unknown LNURL"
		   
		}
		res.setHeader('Content-Type', 'application/json');
	  	res.send(lnurl);
	}
}

export { lnurlstep1 };
import fs from 'fs';

import Database from 'better-sqlite3';
import crypto from "crypto";
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import config from 'config';

const appDb = new Database(config.get("applicationDatabase"));
const serviceUrl = config.get("serviceUrl");


//async 
function lnurlstep2(id,comment,res,lndCredentials){
	
	console.log("GET INOVICE: " + id);
	const dataDb = appDb.prepare("SELECT * FROM invoice WHERE id=?;").get(id);
	if(dataDb!=undefined){
		var amount = dataDb.value;
		var expiry = dataDb.expiry;
		var memo = dataDb.memo;
		var currency = dataDb.currency;
		var bolt11 = "";

		
		//create bolt11 from LND
		
		const loaderOptions = {
		  keepCase: true,
		  longs: String,
		  enums: String,
		  defaults: true,
		  oneofs: true
		};
		const packageDefinition = protoLoader.loadSync('lightning.proto', loaderOptions);
		const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;
	
	
		const macaroon = lndCredentials.macaroon;
		process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
		const lndCert = lndCredentials.cert;
		const sslCreds = grpc.credentials.createSsl(lndCert);
		const macaroonCreds = grpc.credentials.createFromMetadataGenerator(function(args, callback) {
		  let metadata = new grpc.Metadata();
		  metadata.add('macaroon', macaroon);
		  callback(null, metadata);
		});
		let creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
		
		let lightning = new lnrpc.Lightning(process.env.LND_GRPC_ENDPOINT+":"+process.env.LND_GRPC_PORT, creds);
		
		var completeUrl = serviceUrl+ "/v1/invoices";
		var metadatastring = '[["text/plain", "'+memo+'"]]';
		var hashedMemo = crypto.createHash('sha256').update(metadatastring).digest('base64');
		
		let request = { 
		  memo: memo, 
		  value: amount/1000,
		  description_hash: hashedMemo, 
		  expiry: expiry
		}; 
		
		lightning.addInvoice(request, function(err, response) {
		  //console.log(response);
		  
			if(response != undefined && response.r_hash != undefined && response.payment_request != undefined ){

				bolt11 = response.payment_request;
				let hexHash = Buffer.from(response.r_hash, "base64").toString("hex");
				console.log("UPDATE INVOICE: "+ id +" hexHash: " + hexHash);
				
				const dataUpdate = appDb.prepare("UPDATE invoice SET status='OPEN', dateissued=CURRENT_TIMESTAMP, r_hash=?, comment=? WHERE id=?;").run(response.r_hash,comment,id);
				let lnurl = {
				    pr: bolt11,
				    routes: []
				}
				//console.log("response TO WALLET: " + JSON.stringify(lnurl));
				
				const sanity = appDb.prepare("SELECT * FROM invoice WHERE id=?;").get(id);
				console.log("SANITY: " + JSON.stringify(sanity));
			 	res.setHeader('Content-Type', 'application/json');
				
			  	res.send(lnurl);
			
			}
			else{
				res.status(500).json({ error: 'LND error' });
		}		
		});
		
		
		
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

export { lnurlstep2 };
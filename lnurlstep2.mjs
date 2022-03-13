import Database from 'better-sqlite3';
import crypto from "crypto";
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import config from 'config';

const appDb = new Database(config.get("applicationDatabase"));
var serviceUrl = config.get("serviceUrl");
if(serviceUrl ==""){
	serviceUrl = process.env.APP_HIDDEN_SERVICE;
}

function lnurlstep2(id,comment,res,lndCredentials){
	try{
		const dataDb = appDb.prepare("SELECT * FROM invoice WHERE id=?;").get(id);
		if(dataDb!=undefined){
			var amount = dataDb.value;
			var expiry = dataDb.expiry;
			var memo = dataDb.memo;
			var currency = dataDb.currency;
		

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
		
			let lightning = new lnrpc.Lightning(lndCredentials.lndEndpoint+":"+lndCredentials.lndPort, creds);
		
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
			  if(response != undefined && response.r_hash != undefined && response.payment_request != undefined ){
					var bolt11 = response.payment_request;
					let hexHash = Buffer.from(response.r_hash, "base64").toString("hex");
					const dataUpdate = appDb.prepare("UPDATE invoice SET status='OPEN', dateissued=CURRENT_TIMESTAMP, r_hash=?, comment=? WHERE id=?;").run(hexHash,sanitize(comment),id);
					let lnurl = {
					    pr: bolt11,
					    routes: []
					}
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
	catch(err){
		console.error(err);
	}
}
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
export { lnurlstep2 };
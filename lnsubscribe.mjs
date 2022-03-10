import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Database from 'better-sqlite3';
import config from 'config';


//import { mailersend } from './mailersend.js';
import mailersend from './mailersend.js';

import * as EmailValidator from 'email-validator';


const appDb = new Database(config.get("datapath")+"/sparkkiosk.db");
//async 
function lnsubscribe(lndCredentials){
	const settingsDefault = appDb.prepare("SELECT * FROM settings WHERE id='default';").get();
	
	const loaderOptions = {
	  keepCase: true,
	  longs: String,
	  enums: String,
	  defaults: true,
	  oneofs: true
	};
	const packageDefinition = protoLoader.loadSync('lightning.proto', loaderOptions);
	const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;
	
	
	const macaroon = lndCredentials.macaroon
	//console.log("MACAROON: " + macaroon);
	
	process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
	const lndCert = lndCredentials.cert;
	//console.log("CERT: " + lndCert);
	const sslCreds = grpc.credentials.createSsl(lndCert);
	const macaroonCreds = grpc.credentials.createFromMetadataGenerator(function(args, callback) {
	  let metadata = new grpc.Metadata();
	  metadata.add('macaroon', macaroon);
	  callback(null, metadata);
	});
	let creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
	let lightning = new lnrpc.Lightning(process.env.LND_GRPC_ENDPOINT+":"+process.env.LND_GRPC_PORT, creds);
	let request = {}; 
	
	let call = lightning.subscribeInvoices(request);
	call.on('data', function(response) {
		//console.log(response);
		if(response.state=="SETTLED" || response.state=="CANCELED"){
			const invoice = appDb.prepare("SELECT * FROM invoice WHERE r_hash=?;").get(response.r_hash);
			console.log("SUBSCRIBE : "+ response.r_hash + " " + Buffer.from(response.r_hash, 'base64').toString('hex'));
			const dataUpdate = appDb.prepare("UPDATE invoice SET status=?, comment='', r_hash=?;").run(response.state,response.r_hash);
			
			if(invoice != undefined && response.state="SETTLED" && settingsDefault.sendmails){
				mailersend(
					settingsDefault.adminemail,
					invoice.id,
					settingsDefault.mailsubject,
					settingsDefault.mailtext,
					invoice.memo,
					invoice.value,
					invoice.currency,
					settingsDefault.mailersend_apikey,
					settingsDefault.mailersend_template
				);
				if(EmailValidator.validate(invoice.comment)){
					mailersend(
						invoice.comment,
						invoice.id,
						settingsDefault.mailsubject,
						settingsDefault.mailtext,
						invoice.memo,
						invoice.value,
						invoice.currency,
						settingsDefault.mailersend_apikey,
						settingsDefault.mailersend_template
					);
				}
			}
		}
	});//on data end
	call.on('end', function() {
		console.log("SUBSCRIBE ENDED");
	});
	
}

export { lnsubscribe };
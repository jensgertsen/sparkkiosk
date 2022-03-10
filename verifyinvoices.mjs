import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Database from 'better-sqlite3';
import config from 'config';


//import { mailersend } from './mailersend.js';
import pkg from './mailersend.js';
const { mailersend } = pkg;


import * as EmailValidator from 'email-validator';

//console.log("DB: "+ config.get("datapath")+"sparkkiosk.db");
const appDb = new Database(config.get("applicationDatabase"));

function verifyinvoices(lndCredentials){
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
	
	const invoices = appDb.prepare("SELECT * FROM invoice WHERE status='OPEN'").all();

	invoices.forEach(function(ci) {
		let request = { 
		  r_hash: ci.r_hash, 
		}; 
		lightning.lookupInvoice(request, function(err, response) {
			if(response.state=="SETTLED" || response.state=="CANCELED"){
				console.log("FOUND UNNSYNCED: " + ci.r_hash);
				const dataUpdate = appDb.prepare("UPDATE invoice SET status=?, comment='', r_hash=?;").run(response.state,response.r_hash);
				if(data.state="SETTLED" && settingsDefault.sendmails){
					mailersend(
						settingsDefault.adminemail,
						ci.id,
						settingsDefault.mailsubject,
						settingsDefault.mailtext,
						ci.memo,
						ci.value,
						ci.currency,
						settingsDefault.mailersend_apikey,
						settingsDefault.mailersend_template
					);
					if(EmailValidator.validate(invoice.comment)){
						mailersend(
							ci.comment,
							ci.id,
							settingsDefault.mailsubject,
							settingsDefault.mailtext,
							ci.memo,
							ci.value,
							ci.currency,
							settingsDefault.mailersend_apikey,
							settingsDefault.mailersend_template
						);
					}
				}
			}
		});
	});
	
}

export { verifyinvoices };
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Database from 'better-sqlite3';
import config from 'config';
import mailersend from './mailersend.js';
import * as EmailValidator from 'email-validator';

const appDb = new Database(config.get("applicationDatabase"));

function verifyinvoices(lndCredentials){
	try{
		const settingsDefault = appDb.prepare("SELECT * FROM settings WHERE id='default';").get();
		//clean up invoices that are expired - or haven't been created in LND at expiry
		const cleanUpTimeOuts = appDb.prepare("UPDATE invoice set status='CANCELED' WHERE (status='OPEN' OR status='NEW') AND ROUND((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(datecreated)) * 86400) > ?;").run(config.get("invoiceExpiry"));
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
		let lightning = new lnrpc.Lightning(lndCredentials.lndEndpoint+":"+lndCredentials.lndPort, creds);
		const invoices = appDb.prepare("SELECT * FROM invoice WHERE status='OPEN'").all();

		invoices.forEach(function(ci) {
			let request = { 
			  r_hash: ci.r_hash, 
			}; 
			lightning.lookupInvoice(request, function(err, response) {
				if(!(typeof ci === 'undefined') && response.state=="SETTLED" || response.state=="CANCELED"){
				
					let hexHash = Buffer.from(response.r_hash, "base64").toString("hex");
					const dataUpdate = appDb.prepare("UPDATE invoice SET status=?, comment='' WHERE r_hash=?;").run(response.state,hexHash);
					if(ci.id != undefined && response.state=="SETTLED" && settingsDefault.sendmails){
						mailersend(
							settingsDefault.adminemail,
							ci.id,
							settingsDefault.mailsubject,
							settingsDefault.mailtext,
							ci.memo,
							ci.amount,
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
								ci.amount,
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
	catch(err){
		console.error(err);
	}
}

export { verifyinvoices };
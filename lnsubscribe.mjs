import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Database from 'better-sqlite3';
import config from 'config';
import mailersend from './mailersend.js';
import * as EmailValidator from 'email-validator';


const appDb = new Database(config.get("applicationDatabase"));

function lnsubscribe(lndCredentials){
	try{
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
		let lightning = new lnrpc.Lightning(lndCredentials.lndEndpoint+":"+lndCredentials.lndPort, creds);
		let request = {}; 
	
		let call = lightning.subscribeInvoices(request);
		call.on('data', function(response) {
			console.log("SUBSCRIPTION: NEW EVENT: "+ response.state);
			if(response.state=="SETTLED" || response.state=="CANCELED"){
				let hexHash = Buffer.from(response.r_hash, "base64").toString("hex");
			
				console.log("SUBSCRIPTION: hexHash: "+ hexHash);
			
				const invoice = appDb.prepare("SELECT * FROM invoice WHERE r_hash=? AND status='OPEN';").get(hexHash);
				if(!(typeof invoice === 'undefined')){
					const dataUpdate = appDb.prepare("UPDATE invoice SET status=?, comment='' WHERE r_hash=?;").run(response.state,hexHash);
					if(response.state=="SETTLED" && settingsDefault.sendmails){
						mailersend(
							settingsDefault.adminemail,
							invoice.id,
							settingsDefault.mailsubject,
							settingsDefault.mailtext,
							invoice.memo,
							invoice.amount,
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
								invoice.amount,
								invoice.currency,
								settingsDefault.mailersend_apikey,
								settingsDefault.mailersend_template
							);
						}
					}
				}
			
			}
		});//on data end
		call.on('end', function() {
			console.log("SUBSCRIBE ENDED");
		});
	}
	catch(err){
		console.error(err);
	}
	
}

export { lnsubscribe };
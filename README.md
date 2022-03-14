# sparkkiosk
Minimal LNURL kiosk app.

Use sparkkiosk to enable lightning payments from printed QR codes in selfservice kiosks / cafés or other places where POS interaction is not needed or an option.

Log into the dashboard, create a new LNURL, set currency and amount and download QR to print. Monitor latest invoices.


# Emails
Option to send emails upon lightning invoice settlement - to admin and, if email is provided in wallet comment field, costumer as well. 
Uses Mailersend - create an account at mailersend.com and create a new template containing these variables: 

{$mailtext}, {$datetime}, {$invoiceid},{$itemtext}, {$itemprice}, {$itemcurrency} ->See minimal example: mailersend_template.html.

Input Mailersend API key and template id under 'setttings'

# Fiat conversions
Fiat amounts are converted to satoshis using coingecko API.


# CSV export
Its possible to export all invoices generated by the app for use in external systems (ie invoicing).


# Wallet support
Tested with bluewallet - it seems wallet of satoshi has issues with tor endpoints in LNURLS at the moment.


# Umbrel
Made for the umbrel app store - simply install and use password provided by Umbrel.
If used elsewhere set these environment variables: 

APP_PASSWORD
APP_HIDDEN_SERVICE (Tor)
LND_GRPC_MACAROON -> path to LND macaroon
LND_GRPC_CERT -> path to LND cert
LND_GRPC_ENDPOINT -> LND IP
LND_GRPC_PORT -> LND gRPC port

Additional settings are configured in config/defaul.json


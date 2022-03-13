const Recipient = require("mailersend").Recipient;
const EmailParams = require("mailersend").EmailParams;
const MailerSend = require("mailersend");
const date = require('date-and-time');
var validator = require("email-validator");


module.exports = function (recipient, id, subject,mailtext, itemtext, itemprice, itemcurrency,key,template){

	if(validator.validate(recipient) && key!="" && template!= ""){
		const mailersend = new MailerSend({api_key: key,});
		const recipients = [new Recipient(recipient, " ")];
		const now = new Date();
	
		const variables = [{
		    email: recipient,
		    substitutions: [
		      {
		        var: 'mailtext',
				  value: mailtext+""
		      },
		      {
		        var: 'datetime',
		        value: date.format(now, 'DD/MM/YYYY HH:mm')
		      },
			  {
                  'var': 'invoiceid',
                  'value': id+""
              },
		      {
		        var: 'itemtext',
		        value: itemtext+""
		      },
		      {
		        var: 'itemprice',
		        value: itemprice+""
		      },
			  {
		        var: 'itemcurrency',
		        value: itemcurrency+""
		      }
		    ],
		  }
		];	
		const emailParams = new EmailParams()
		    .setRecipients(recipients)
		    .setSubject(subject)
		    .setTemplateId(template)
		    .setVariables(variables);
		mailersend.send(emailParams);
	}

}
const Recipient = require("mailersend").Recipient;
const EmailParams = require("mailersend").EmailParams;
const MailerSend = require("mailersend");
const date = require('date-and-time');
var validator = require("email-validator");


module.exports = function (recipient, id, subject,mailtext, itemtext, itemprice, itemcurrency,key,template){
//'3yxj6lj9zk14do2r'
//var key="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZjAyY2I0NjZmYjRkOGY3ODIyMTYxYzQ2ZGUxOGYwNzE1ZWNhODU0NWUzNTI1YjBlMmY0ZmVhZDA1ZmJkODZkNjE2YmFkYTM1ZDdlNmZhODQiLCJpYXQiOjE2NDY3MzA4NjIuMDYwNzEsIm5iZiI6MTY0NjczMDg2Mi4wNjA3MTMsImV4cCI6NDgwMjQwNDQ2Mi4wNTcwMzUsInN1YiI6IjIyNTE0Iiwic2NvcGVzIjpbImVtYWlsX2Z1bGwiLCJ0ZW1wbGF0ZXNfZnVsbCJdfQ.GF31ysK9s4ZgEZcW6SpbePX7n0wDbvbpT3RAL5Tz7TOuG6Q4jRNLycrkoikEPf7da-Bod13RHbKEuQO5OUcHlrYlVIBFDzP7dcChwvjFnjOfqmEK0XmEiiXPWRhNb44MEpX4EAVbZUTq5lFUXJC5h-eAPb-uOCCJf0a4bMtEPATafqHxwqG8VEoKVoTh9L40oUgC9EG90IaiwCC2XTN2nkF6btQxyglnEy-r8_Vt3fB8eN_ir0trJoMXXjhjZHjWXbSyFLVcSa4O5OaasulkrZEwLthRLKaFja_RVPSGO0-1ndPsQ0pYIsTlAF7qktUNSVMUVksyirWxXvnswZusEz7Yfy2m_thuu-Mmc1v7DFJl5jxx1pD7kMWwT6BADWJVIRjPeaC6TckLZ-qztm-7TxrwhQvGfbfSPEQwI5h2G98dy8mQqoakQuRuxEql_46qH0qMv23kSRdDukOVuYkyEfuOJ7oSAzRoN3jxKwLbtWg8im0-T0CSoBZadQXYEjZaHI_Xvi_ykaTdFNCDkRFGxlG_fR6Ap0fDRWuiPE7vxNvAI76kfsxfRvY1d3nDv30AbIh264ll-47gnxCWhyjB0fRA6iEcGakilLJRfoHXSc08WOc3s4hkqzWTcmGT9c-2bT8ntNTspYPYkrYdrZbw0YJfaw5JXlqbWAJI0qtYzMk";
	if(validator.validate(recipient)){
		const mailersend = new MailerSend({api_key: key,});
		const recipients = [new Recipient(recipient, " ")];
		const now = new Date();
	
		const variables = [{
		    email: recipient,
		    substitutions: [
		      {
		        var: 'mailtext',
				  value: mailtext
		      },
		      {
		        var: 'datetime',
		        value: date.format(now, 'DD/MM/YYYY HH:mm')
		      },
			  {
                  'var': 'invoiceid',
                  'value': id
              },
		      {
		        var: 'itemtext',
		        value: itemtext
		      },
		      {
		        var: 'itemprice',
		        value: itemprice
		      },
			  {
		        var: 'itemcurrency',
		        value: itemcurrency
		      }
		    ],
		  }
		];	
		const emailParams = new EmailParams()
		    .setRecipients(recipients)
		    .setSubject(subject)
		    .setTemplateId(template)
		    .setVariables(variables);


		/*const emailParams = new EmailParams()
		    .setFrom("noreply@tekstur.dk")
		    .setFromName("Your Name")
		    .setRecipients(recipients)
		    .setSubject("Subject")
		    .setTemplateId('3yxj6lj9zk14do2r')
		    .setVariables(variables);
		*/
		mailersend.send(emailParams);
	}

}
create table settings(
	id text,
	currency text,
	mailsubject text,
	mailtext text,
	sendmails text,
	mailersend_apikey text,
	mailersend_template text,
	adminemail text
);

create table invoice(
	id text,
	datecreated text,
	dateissued text,
	value integer,
	expiry integer,
	memo text,
	r_hash text,
	lnurl text,
	status text,
	amount integer,
	currency text, 
	comment text
);
alter table invoice add comment text;

create table lnurl(
	id text,
	datecreated text,
	description text,
	invoice text,
	amount integer,
	currency text,
	status text,
	encodedurl text
);

alter table settings add sendmails text;
alter table settings add mailersend_apikey text;
alter table settings add mailersend_template text;
alter table settings add adminemail text;

UPDATE settings set adminemail='gertsen@tekstur.dk' WHERE id='default';
UPDATE settings set sendmails='true' WHERE id='default';
UPDATE settings set mailersend_template='3yxj6lj9zk14do2r' WHERE id='default';

INSERT INTO settings (id,currency,mailsubject,mailtext) VALUES ('default','DKK','','');


INSERT INTO lnurl (id,datecreated,description,amount,currency,status) VALUES ('PN2Y9VBRNQ','2022-02-21 16:31:30.000','Gul sodavand',100,'DKK','active');
INSERT INTO lnurl (id,datecreated,description,amount,currency,status) VALUES ('RU6NS2KHVX','2022-02-21 16:32:30.000','Rød sodavand',110,'DKK','active');


ALTER TABLE invoice add amount integer;
ALTER TABLE invoice add currency text;
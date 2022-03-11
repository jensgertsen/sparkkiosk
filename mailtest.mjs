import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import Database from 'better-sqlite3';
import config from 'config';


//import { mailersend } from './mailersend.js';
import mailersend from './mailersend.js';






				mailersend(
					"gertsen@tekstur.dk",
					"123",
					"SPARKKIOSK Invoice",
					"Lorem Ipsum ...",
					"Itemname",
					2,
					"DKK",
					"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZjAyY2I0NjZmYjRkOGY3ODIyMTYxYzQ2ZGUxOGYwNzE1ZWNhODU0NWUzNTI1YjBlMmY0ZmVhZDA1ZmJkODZkNjE2YmFkYTM1ZDdlNmZhODQiLCJpYXQiOjE2NDY3MzA4NjIuMDYwNzEsIm5iZiI6MTY0NjczMDg2Mi4wNjA3MTMsImV4cCI6NDgwMjQwNDQ2Mi4wNTcwMzUsInN1YiI6IjIyNTE0Iiwic2NvcGVzIjpbImVtYWlsX2Z1bGwiLCJ0ZW1wbGF0ZXNfZnVsbCJdfQ.GF31ysK9s4ZgEZcW6SpbePX7n0wDbvbpT3RAL5Tz7TOuG6Q4jRNLycrkoikEPf7da-Bod13RHbKEuQO5OUcHlrYlVIBFDzP7dcChwvjFnjOfqmEK0XmEiiXPWRhNb44MEpX4EAVbZUTq5lFUXJC5h-eAPb-uOCCJf0a4bMtEPATafqHxwqG8VEoKVoTh9L40oUgC9EG90IaiwCC2XTN2nkF6btQxyglnEy-r8_Vt3fB8eN_ir0trJoMXXjhjZHjWXbSyFLVcSa4O5OaasulkrZEwLthRLKaFja_RVPSGO0-1ndPsQ0pYIsTlAF7qktUNSVMUVksyirWxXvnswZusEz7Yfy2m_thuu-Mmc1v7DFJl5jxx1pD7kMWwT6BADWJVIRjPeaC6TckLZ-qztm-7TxrwhQvGfbfSPEQwI5h2G98dy8mQqoakQuRuxEql_46qH0qMv23kSRdDukOVuYkyEfuOJ7oSAzRoN3jxKwLbtWg8im0-T0CSoBZadQXYEjZaHI_Xvi_ykaTdFNCDkRFGxlG_fR6Ap0fDRWuiPE7vxNvAI76kfsxfRvY1d3nDv30AbIh264ll-47gnxCWhyjB0fRA6iEcGakilLJRfoHXSc08WOc3s4hkqzWTcmGT9c-2bT8ntNTspYPYkrYdrZbw0YJfaw5JXlqbWAJI0qtYzMk",
					"3yxj6lj9zk14do2r"
				);
				
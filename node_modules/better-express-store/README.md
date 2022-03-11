# better-express-store
A session store for [express-session](https://www.npmjs.com/package/express-session) using the db driver [better-sqlite3](https://www.npmjs.com/package/express-session)

## What does this module do?

[Express-session](https://www.npmjs.com/package/express-session) uses the internal memory as its default store for sessions. This is not recommended in a production environment.

If you use [SQLite](https://www.sqlite.org/index.html) as your database and [better-sqlite3](https://www.npmjs.com/package/express-session) as your database driver then this module easily lets you store your sesions in the db.


## Installation
You need to have installed [express](https://www.npmjs.com/package/express), [express-session](https://www.npmjs.com/package/express-session) and [better-sqlite3](https://www.npmjs.com/package/express-session) first:

```
npm i express
npm i express-session
npm i better-sqlite3
```

Then you install **better-express-store**:

```
npm i better-express-store
```

## Usage

This is an example of how you use this module:

```js
const express = require('express');
const session = require('express-session');
const store = require('better-express-store');

const app = express();

// When setting up express session
app.use(session({
  secret: 'your own secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto' },
  // change dbPath to the path to your database file
  store: store({  dbPath: './db/my-db.db'})
}));

// Set up other middleware and start your server...
```

### Defaults
Apart from your dbPath there are also other settings you can adjust.

The settings (listed together with their default values):

```js
{
  dbPath: false, // no default - needs to specified
  tableName: 'sessions',
  deleteAfterInactivityMinutes: 120, // 0 = never delete
}
```
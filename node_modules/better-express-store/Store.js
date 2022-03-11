// Ironboy 2020
// A epxpress-session store plugin
// for the better-sqlite3 database driver


const DbHandler = require('./DbHandler');

// The express session documentation says that a store should
// extend Node EventEmitter, but actually it shold extend their
// basic Store class!
const esStore = require("express-session").Store;

module.exports = class Store extends esStore {

  constructor(settings) {

    super();

    this.settings = Object.assign({
      // defaults
      dbPath: false, // no default - needs to specified
      tableName: 'sessions',
      deleteAfterInactivityMinutes: 120, // 0 = never delete
      betterSqlite3: require('better-sqlite3')
    }, settings);

    if (this.settings.dbPath === false) {
      throw (new Error('Please provide a dbPath!'));
    }

    this.db = new DbHandler(
      this.settings.betterSqlite3,
      this.settings.dbPath
    );

    this.db.run(`
      CREATE TABLE IF NOT EXISTS ${this.settings.tableName} (
        sid TEXT PRIMARY KEY NOT NULL UNIQUE,
        session TEXT,
        lastupdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    setInterval(() => this.deleteAfterInactivity(), 10000);

  }

  // Most of the methods a express 
  // session store needs are documented here
  // https://www.npmjs.com/package/express-session#session-store-implementation

  // cb = callback
  // express sesion expects the store methods to reply
  // by calling a callback function

  all(cb = x => x) {
    cb(null, this.db.select(`
      SELECT session FROM ${this.settings.tableName}
    `).map(x => x.session));
  }

  destroy(sid, cb = x => x) {
    this.db.run(`
      DELETE FROM ${this.settings.tableName}
      WHERE sid = $sid
    `, { sid });
    cb(null);
  }

  clear(cb = x => x) {
    this.db.run(
      `DELETE FROM ${this.settings.tableName}`
    );
    cb(null);
  }

  length(cb = x => x) {
    cb(null, this.db.select(`
      SELECT COUNT(*) as len
      FROM ${this.settings.tableName}`)[0].len
    );
  }

  get(sid, cb = x => x) {
    let x = this.db.select(`
      SELECT session FROM ${this.settings.tableName}
      WHERE sid = $sid 
    `, { sid });
    x = x.length ? x[0].session : null;
    cb(null, JSON.parse(x));
  }

  set(sid, session, cb = x => x) {
    session = JSON.stringify(session);
    this.destroy(sid);
    this.db.run(`
      INSERT INTO ${this.settings.tableName} (sid, session)
      VALUES ($sid, $session) 
    `, { sid, session });
    cb(null);
  }

  touch(...args) {
    this.set(...args);
  }

  // Not documented: on is called two eventhandlers 'connect' and 'disconnect'
  // so handle this with the by calling the callback if the event is connect
  // - since we are connected right away we will callback at once
  // - and we do not seem to need to handle disconnect...
  on(event, cb) {
    event === 'connect' && cb();
  }

  // Delete sessions after inactivity
  deleteAfterInactivity() {
    let m = this.settings.deleteAfterInactivityMinutes;
    if (!m) { return; }
    this.db.run(`
      DELETE FROM ${this.settings.tableName}
      WHERE (strftime('%s','now') - strftime('%s', lastupdate)) / 60 > $m
    `, { m });
  }

}
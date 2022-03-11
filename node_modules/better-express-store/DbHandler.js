module.exports = class DbHandler {

  constructor(betterSqlite3, dbPath) {
    this.db = betterSqlite3(dbPath);
  }

  select(sql, parameters) {
    // When using the SQLite driver
    // we create (prepared) statements
    let statement = this.db.prepare(sql);
    // here we use the statement with the method 
    // all that retrieves all data
    try {
      return parameters ? statement.all(parameters) : statement.all();
    }
    catch (error) {
      return { error: error.name };
    }
  }

  run(sql, parameters) {
    let statement = this.db.prepare(sql);
    // here we use the statement with the method 
    // run (the correct method if it does not return data)
    try {
      return parameters ? statement.run(parameters) : statement.run();
    }
    catch (error) {
      return { error: error.name };
    }
  }

}
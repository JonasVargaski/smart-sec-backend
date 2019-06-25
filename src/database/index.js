const mysql = require("mysql");
const config = require("../config/database");

const execSQLQuery = sqlquery => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(config);

    connection.query(sqlquery, (err, result) => {
      if (err) {
        connection.rollback(() => {
          reject(err);
        });
      }
      connection.commit(err => {
        if (err) {
          connection.rollback(() => {
            reject(err);
          });
        }
        connection.end();
        resolve(Array.isArray(result) ? result : [result]);
      });
    });
  });
};

module.exports = execSQLQuery;

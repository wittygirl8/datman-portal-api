const Sequelize = require("sequelize");
const path = require("path");
// var env = process.env.NODE_ENV || "development";
var env = process.env.NODE_ENV || "production"

var config = require(path.join(__dirname, '.', 'config', 'config.json'))[env];
var sequelize = new Sequelize(config.database, config.username, config.password, config);

var db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
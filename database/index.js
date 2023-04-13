const Sequelize = require("sequelize");

if(process.env.MODE == "prod"){
    console.log('using LIVE DB')
    var config = JSON.parse(process.env.PROD_DB_CRED)
}
else if(process.env.MODE == 'dev'){
    console.log('using SNAPSHOT DB ')
    var config = JSON.parse(process.env.PROD_DB_CRED_SNAPSHOT)
}
else if(process.env.MODE == 'loc'){
    var config = {
        "username": "dbuser",
        "password": "dbpassword",
        "database": "datamandb",
        "host": "127.0.0.1",
        "dialect": "mysql",
        "pool": {
            "max": 5,
            "min": 0,
            "idle": 10000
        }   
    }
}
else {
    console.log('no database config is provided')
    
}



var sequelizeInstance = new Sequelize(config.database, config.username, config.password, config);

module.exports.sequelizeInstance = sequelizeInstance;
module.exports.Sequelize = Sequelize;

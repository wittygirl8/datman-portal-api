const {sequelizeInstance, Sequelize} = require('../')


  const  CustomerSpecialRent = sequelizeInstance.define('customer_special_rent', {
    id: {
      autoIncrement: true,
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    user_added: {
      type: Sequelize.STRING(200),
      allowNull: true
    },
    date_added: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    active_status: {
      type: Sequelize.ENUM('ACTIVE','DISABLED'),
      allowNull: true,
      defaultValue: "ACTIVE"
    },
    rent_amount: {
      type: Sequelize.DOUBLE,
      allowNull: true
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'customer_special_rent',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "customer_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "customer_id" },
          { name: "start_date" },
          { name: "end_date" },
        ]
      },
    ]
  });


module.exports = CustomerSpecialRent;

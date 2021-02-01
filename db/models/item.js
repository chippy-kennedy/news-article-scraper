'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
			this.belongsTo(models.Dataset, {foreignKey: 'datasetKey'})
    }
  };
  Item.init({
		key: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: sequelize.UUIDV4
		},
    scaleTaskId: DataTypes.STRING,
		data: DataTypes.JSON,
		synced: DataTypes.BOOLEAN,
		datasetKey: DataTypes.UUID,
  }, {
    sequelize,
    modelName: 'Item',
  });
  return Item;
};

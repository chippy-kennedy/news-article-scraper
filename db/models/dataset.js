'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Dataset extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Dataset.init({
		key: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: sequelize.UUIDV4
		},
		itemCount: DataTypes.INTEGER,
		itemType: DataTypes.STRING,
		spacesKey: DataTypes.STRING,
    spacesUrl: DataTypes.STRING,
    name: DataTypes.STRING,
		format: DataTypes.STRING,
		size: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Dataset',
  });
  return Dataset;
};

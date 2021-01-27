'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Datasets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
			itemCount: {
				type: Sequelize.INTEGER
			},
			itemType: {
				type: Sequelize.STRING,
			},
      spacesKey: {
        type: Sequelize.STRING,
				unique: true
      },
      spacesUrl: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
			size: {
				type: Sequelize.STRING
			},
			format: {
				type: Sequelize.STRING
			},
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Datasets');
  }
};

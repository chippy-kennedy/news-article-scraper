'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Datasets', {
      key: {
				type: Sequelize.UUID,
				allowNull: false,
				primaryKey: true,
				defaultValue: Sequelize.UUIDV4
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

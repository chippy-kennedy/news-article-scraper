'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Items', {
      key: {
				type: Sequelize.UUID,
				allowNull: false,
				primaryKey: true,
				defaultValue: Sequelize.UUIDV4
      },
			datasetKey: {
        type: Sequelize.UUID
			},
      scaleTaskId: {
        type: Sequelize.STRING
      },
			synced: {
        type: Sequelize.BOOLEAN
			},
			data: {
				type: Sequelize.JSON
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
    await queryInterface.dropTable('Items');
  }
};

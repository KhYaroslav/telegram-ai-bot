'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({ Question, Answer }) {
      this.hasMany(Question, { foreignKey: 'user_id' });
      this.hasMany(Answer, { foreignKey: 'user_id' });
    }
  }
  User.init({
    username: DataTypes.STRING,
    telegram_id: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
const Router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const CategoryController = require('../controllers/category.controller');

Router.get('/all', CategoryController.getAll);
Router.get('/getCategoryById', CategoryController.getCategoryById);
Router.get('/countCategory', CategoryController.countCategory)
Router.post('/addOrUpdate', AuthController.authorizeServiceUser, CategoryController.addOrUpdateCategory);
Router.post('/delete',AuthController.authorizeServiceUser, CategoryController.deleteCategoryById);
Router.post('/deleteMany',AuthController.authorizeServiceUser, CategoryController.deleteCategory);
Router.post('/changeActive', AuthController.authorizeServiceUser, CategoryController.updateActive)
module.exports = Router;
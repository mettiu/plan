'use strict';

var express = require('express');
var controller = require('./company.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/find', controller.find); // per la ricerca per nome
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;

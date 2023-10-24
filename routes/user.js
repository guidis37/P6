const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const password = require('../middleware/passwordValidator')

router.post('/signup', password, userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;
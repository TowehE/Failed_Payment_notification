const express = require('express');

const router = express.Router();

const { deposit} = require('../controller/walletController');
const {authenticate} = require('../middleware/authentation');

//endpoint to handle deposit money
router.post("/deposit",authenticate, deposit )




module.exports = router;
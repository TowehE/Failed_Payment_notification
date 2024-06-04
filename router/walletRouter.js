const express = require('express');

const router = express.Router();

const { deposit, getBalance, withdraw} = require('../controller/walletController');
const {authenticate} = require('../middleware/authentation');

//endpoint to handle deposit money
router.post("/deposit",authenticate, deposit )


//endpoint to get Balance
router.get("/balance/:userId", getBalance )


//endpoint to withdraw
router.post("/withdraw/:userId", withdraw )


module.exports = router;
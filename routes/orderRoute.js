const express = require("express")
const {authenticate} = require("../middlewares/authenticate")
const {applyPricingRules} = require("../middlewares/applyPricingRule")
const { getPriceDetails } = require("../controllers/orderController")

const route = express.Router()

route.post("/priceDetails", authenticate, applyPricingRules, getPriceDetails)

module.exports = route
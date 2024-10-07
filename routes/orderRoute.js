const express = require("express")
const {authenticate} = require("../middlewares/authenticate")
const {applyPricingRules} = require("../middlewares/applyPricingRule")
const { getPriceDetails, addOrder, getAllOrder } = require("../controllers/orderController")
const { adminAuth } = require("../middlewares/adminAuth")

const route = express.Router()

const attachSocketIO = (io) => {

    route.get("/", adminAuth, getAllOrder)
    
    route.post("/priceDetails", authenticate, applyPricingRules, getPriceDetails)
    route.post("/add", authenticate, (request, response) => addOrder(request, response, io))

    return route
}
module.exports = attachSocketIO
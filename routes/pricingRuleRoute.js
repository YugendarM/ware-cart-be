const express = require("express")
const {getAllPricingRule, addPricingRule, updatePricingRule, deletePricingRule} = require("../controllers/pricingRuleController")
const {adminAuth} = require("../middlewares/adminAuth")

const route = express.Router()

const attachSocketIO = (io) => {
    route.get("/", adminAuth, getAllPricingRule)

    route.post("/add", adminAuth, (request, response) => addPricingRule(request, response, io))

    route.put("/update/:pricingRuleId", adminAuth, (request, response) => updatePricingRule(request, response, io))

    route.delete("/delete/:pricingRuleId", adminAuth, (request, response) => deletePricingRule(request, response, io))

    return route
}

module.exports = attachSocketIO
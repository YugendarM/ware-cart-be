const pricingRuleModel = require("../models/pricingRuleModel")
const userModel = require("../models/userModel")

const applyPricingRules = async (request, response, next) => {
    const orderItems = request.body.orderItems; 
    const userData = request.user; 

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return response.status(400).json({ status: "Bad request", code: 400, message: "No items in the order" });
    }

    const customerType = userData.customerType;
    const activeRules = await pricingRuleModel.find({ active: true });

    orderItems.forEach(item => {
        item. discountPrice = 0; // Initialize  discountPrice
        item.totalPrice = item.quantity * item.productDetails.price;

        item.appliedRule = []; // Initialize appliedRule
        activeRules.forEach(rule => {
            let ruleApplied = false;

            // Check for volume-based discount
            if (rule.condition === 'volume' && rule.active && item.quantity >= rule.threshold) {
                const discount = item.productDetails.price * (rule.discountPercentage / 100);
                item. discountPrice += discount*item.quantity; // Accumulate discount
                ruleApplied = true;
            }

            // Check for customer type discount
            if (rule.condition === 'customerType' && rule.active && rule.customerType.includes(customerType)) {
                const discount = item.productDetails.price * (rule.discountPercentage / 100);
                item. discountPrice += discount*item.quantity; // Accumulate discount
                ruleApplied = true;
            }

            // Check for promotional discount
            if (rule.condition === 'promotion' && rule.active) {
                const discount = item.productDetails.price * (rule.discountPercentage / 100);
                item. discountPrice += discount*item.quantity; // Accumulate discount
                ruleApplied = true;
            }

            // If a rule is applied, store the rule details
            if (ruleApplied) {
                item.appliedRule.push({
                    _id: rule._id,
                    name: rule.name,
                    discountPercentage: rule.discountPercentage,
                    condition: rule.condition,
                    item: item.productDetails._id 
                });
            }
        });
    });

    request.orderItems = orderItems; 
    next(); 
};

module.exports = { applyPricingRules }; 

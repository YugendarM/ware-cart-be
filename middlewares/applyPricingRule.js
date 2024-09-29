const pricingRuleModel = require('../models/pricingRuleModel')

const applyPricingRules = async (request, response, next) => {
    const orderItems = request.body
    const userData = request.user

    const customerType = userData.customerType

    const activeRules = await pricingRuleModel.find({ active: true })

    orderItems.forEach(item => {
        activeRules.forEach(rule => {
            if (rule.condition === 'volume' && item.quantity >= rule.threshold) {
                item.discountedPrice = item.price - (item.price * (rule.discountPercentage / 100));
            }

            if (rule.condition === 'customerType' && rule.customerType.includes(customerType)) {
                item.discountedPrice = item.price - (item.price * (rule.discountPercentage / 100));
            }
        });
    });

    request.body.orderItems = orderItems;
    next();
}; 

module.exports = {applyPricingRules}
const mongoose = require("mongoose")

const pricingRuleSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    },
    condition: {
        type: String,
        enum: ["volume", "price", "promotion", "customerType"],
        required: true
    },
    threshold: {
        type: Number
    },
    discountPercentage: {
        type: Number
    },
    customerType: [{
        type: String
    }],
    active: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date
    }
}, 
{
    collection: "pricingRule",
    timestamps: true
})

module.exports = mongoose.model("pricingRule", pricingRuleSchema)
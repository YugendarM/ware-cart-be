const mongoose = require("mongoose")

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "warehouse"
    },
    stockLevel: {
        type: Number,
        default: 0
    },
    reservedStock: {
        type: Number,
        default: 0
    },
    stockThreshold: {
        type: Number
    }
    
}, {
    collection: "inventory",
    timestamps: true
})

module.exports = mongoose.model("inventory", inventorySchema)
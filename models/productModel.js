const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required:  true
    },
    productType: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }

}, {
    collection: "product",
    timestamps: true
})

module.exports = mongoose.model("product", productSchema)
const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required:  true
    },
    productType: {
        type: String,
        enum: ["book", "mobile", "pen"],
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    images: [{
        type: String
    }]
}, {
    collection: "product",
    timestamps: true
})

module.exports = mongoose.model("product", productSchema)
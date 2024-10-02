const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    firstName: {
        type: String, 
        required: [true, "First Name is mandatory"]
    },
    lastName: {
        type: String, 
        required: [true, "Last Name is mandatory"]
    },
    email: {
        type: String, 
        required: [true, "Email is mandatory"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is mandatory"],
        min: 8,
        max: 25,
        select: false
    },
    phoneNo: {
        type: String,
    },
    city: {
        type: String,
    },
    addressFirstLine: {
        type: String
    },
    addressSecondLine: {
        type: String
    },
    state: {
        type: String
    },
    pincode: {
        type: Number,
    },
    customerType: {
        type: String,
        enum: ["Regular","VIP", "Gold", "Silver"],
        default: "Regular"
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    }],
    cart:[{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    }],
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
}, {
    collection: "user",
    timestamps: true
})

module.exports = mongoose.model("user", userSchema)
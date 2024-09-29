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
        unique: true,
        sparse: true
    },
    city: {
        type: String,
    },
    pincode: {
        type: Number,
    },
    customerType: {
        type: String,
        enum: ["Regular","VIP", "Gold", "Silver"],
        default: "Regular"
    },
    cart: {
        cartItems: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'product'
                },
                quantity: {
                    type: Number
                },
                price: {
                    type: Number
                },
                totalPrice: {
                    type: Number
                },
                addedOn: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        cartTotal: {
            type: Number
        },
        
    },
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
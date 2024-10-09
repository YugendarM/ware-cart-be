const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: 'user',
        required: true
      },
      products: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'product',
            required: true
          },
          quantity: {
            type: Number,
            required: true,
            min: 1
          },
          price: {
            type: Number,               
            required: true
          },
        }
      ],
      totalAmount: {
        type: Number,
        required: true          
      },
      discountedAmount: {
        type: Number, 
      },
      platformFee : {
        type: Number
      },
      payableAmount: {
        type: Number
      },
      paymentInfo: {
        paymentMethod: {
          type: String,
          enum: ['gpay', 'phonepe', 'stripe', 'paypal', "cod"],
          required: true
        },
        paymentStatus: {
          type: String,
          enum: ['pending', 'completed', 'failed', 'refunded'],
          default: 'pending'
        },
        transactionId: {
          type: String,
          // required: function () {
          //   return this.paymentStatus === 'completed';  // Only required when payment is completed
          // }
        }
      },
      shippingInfo: {
        firstName: {
          type: String,
          required: true
        },
        addressFirstLine: {
          type: String,
          required: true
        },
        addressSecondLine: {
            type: String,
            required: true
        },
        city: {
          type: String,
          required: true
        },
        pincode: {
          type: String,
          required: true
        },
        country: {
          type: String,
          // required: true
        },
        phoneNo: {
          type: String,
          required: true
        },
        shippingMethod: {
          type: String,
          enum: ['Standard', 'Express', 'Overnight'],
          default: 'Standard'
        }
      },
      orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
        default: 'Processing'
      },
},
{
    collection: "order",
    timestamps: true
})

module.exports = mongoose.model("order", orderSchema)
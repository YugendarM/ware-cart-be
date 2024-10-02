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
        //   discount: {
        //     type: Number,              
        //     default: 0
        //   }
        }
      ],
      totalAmount: {
        type: Number,
        required: true          
      },
      discountedAmount: {
        type: Number, 
      },
      paymentInfo: {
        paymentMethod: {
          type: String,
          enum: ['Credit Card', 'PayPal', 'Stripe', 'Cash on Delivery'],
          required: true
        },
        paymentStatus: {
          type: String,
          enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
          default: 'Pending'
        },
        transactionId: {
          type: String,
          required: function () {
            return this.paymentStatus === 'Completed';  // Only required when payment is completed
          }
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
          required: true
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
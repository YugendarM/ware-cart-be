const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  action: { type: String, required: true }, // e.g., 'page_view', 'add_to_cart', 'purchase'
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' }, // The product user interacted with
  additionalInfo: { type: Map, of: String } // Can hold extra details like cart quantities
},{
    collection: "userActivity",
    timestamps: true
});

module.exports = mongoose.model('userActivity', userActivitySchema);
 


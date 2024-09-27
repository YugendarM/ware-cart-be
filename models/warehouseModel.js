const mongoose = require("mongoose")

const warehouseSchema = new mongoose.Schema({
    warehouseName: {
        type: String,
        required:  true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        latitude: {
            type: String,
        },
        longitude: {
            type: String
        }
    },
    capacity: {
        type: Number,
        required: true
    },
    
}, {
    collection: "warehouse",
    timestamps: true
})

module.exports = mongoose.model("warehouse", warehouseSchema)
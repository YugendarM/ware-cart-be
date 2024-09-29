const express = require("express")
const { getAllInventory, updateInventory, getInventoryById, addProductToInventory, deleteInventory } = require("../controllers/inventoryController")
const {adminAuth} = require("../middlewares/adminAuth")

const route = express.Router()



const attachSocketIO = (io) => {

    route.get("/", adminAuth, getAllInventory)
    route.get("/:inventoryId", adminAuth, getInventoryById)

    route.post("/add", adminAuth, (request, response) => addProductToInventory(request, response, io))

    route.put("/update/:inventoryId", adminAuth, (request, response) => updateInventory(request, response, io))

    route.delete("/delete/:inventoryId", adminAuth, (request, response) => deleteInventory(request, response, io))

    return route
}


module.exports = attachSocketIO
const express = require("express")
const { getAllInventory, updateInventory, getInventoryById, addProductToInventory, deleteInventory } = require("../controllers/inventoryController")

const route = express.Router()



const attachSocketIO = (io) => {

    route.get("/", getAllInventory)
    route.get("/:inventoryId", getInventoryById)

    route.post("/add", (request, response) => addProductToInventory(request, response, io))

    route.put("/update/:inventoryId", (request, response) => updateInventory(request, response, io))

    route.delete("/delete/:inventoryId", (request, response) => deleteInventory(request, response, io))

    return route
}


module.exports = attachSocketIO
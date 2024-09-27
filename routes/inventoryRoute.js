const express = require("express")
const { getAllInventory, updateInventory, getInventoryById, addProductToInventory, deleteInventory } = require("../controllers/inventoryController")

const route = express.Router()

route.get("/", getAllInventory)
route.get("/:inventoryId", getInventoryById)

route.post("/add", addProductToInventory)

route.put("/update/:inventoryId", updateInventory)

route.delete("/delete/:inventoryId", deleteInventory)



module.exports = route
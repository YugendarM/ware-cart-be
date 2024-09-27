const express = require("express")
const { getAllWarehouse, addWarehouse, getWarehouseById, deleteWarehouse, updateWarehouse } = require("../controllers/warehouseController")

const route = express.Router()

route.get("/", getAllWarehouse)
route.get("/:warehouseId", getWarehouseById)

route.post("/add", addWarehouse)

route.delete("/delete/:warehouseId", deleteWarehouse)

route.put("/update/:warehouseId", updateWarehouse)

module.exports = route
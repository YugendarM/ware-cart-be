require("dotenv").config()
const express = require("express")
const http = require("http")
const socketIO = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const FE_BASE_URL = process.env.FE_BASE_URL

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

const PORT = process.env.PORT || 3500

const warehouseRoute = require("./routes/warehouseRoute")
const productRoute = require("./routes/productRoute")
const inventoryRoute = require("./routes/inventoryRoute")

app.use(cors({
    origin: FE_BASE_URL, 
    methods: ['GET', 'POST', 'DELETE', 'PUT'], 
    credentials: true, 
  }));
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get("/api/v1", (request, response) => {
    response.send("Server Running")
})

const attachedWarehouseRoute = warehouseRoute(io)
const attachedInventoryRoute = inventoryRoute(io)
app.use("/api/v1/warehouse", attachedWarehouseRoute)
app.use("/api/v1/product", productRoute)
app.use("/api/v1/inventory", attachedInventoryRoute)

io.on("connection", (socket) => {
    console.log("New client connected", socket.id)

    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id)
    })
})

mongoose.connect(process.env.DB_URL)
const db = mongoose.connection
db.on('error', (errorMessage) => console.log(errorMessage))
db.once('open', () => console.log('Connected to db successfully'))

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:3500`)
}) 
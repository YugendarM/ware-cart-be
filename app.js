require("dotenv").config()
const express = require("express")
const app = express()

const PORT = process.env.PORT || 3500

app.get("/api/v1", (request, response) => {
    response.send("Server Running")
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:3500`)
}) 
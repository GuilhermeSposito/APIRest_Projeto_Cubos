const express = require('express');
const app = express();
const routers = require('./routers/router')
require('dotenv').config({ path: './.env' })

app.use(express.json())
app.use(routers)

app.listen(process.env.PORT, () => {
    console.log("Servidor iniciado")
})
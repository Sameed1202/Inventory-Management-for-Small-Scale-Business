var http = require('http');
var express = require('express');
const app = express();
const cors = require('cors');

//To define port of server
const port=process.env.port || 7001;

//Used to call MogoDB Models for database operations
const mongoDbService=require('./backendservice/mongodbservice')

//Used for product and order data
const productService = require('./backendservice/productservice')
const orderService = require('./backendservice/orderservice')
const cartService = require('./backendservice/cartService')

//To enable CORS
app.use(cors({
  origin: '*'
}));

//Creating HTTP listner on port
http.createServer(app).listen(port);

//Connecting to MongoDB
mongoDbService.connectMongoDb();

//Listening for API calls
productService.getAllProductServiceCall(app);
orderService.getAllOrderServiceCall(app);
cartService.getAllCartServiceCall(app);

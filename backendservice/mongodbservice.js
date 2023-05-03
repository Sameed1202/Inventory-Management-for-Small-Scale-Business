const mongoose = require("mongoose");
const appConfig = require("../config/appConfig");

require("../schema/product");
require("../schema/order");
require("../schema/cart");

const productModel = mongoose.model("product");
const orderModel = mongoose.model("order");
const cartModel = mongoose.model("cart");

///mongoDbStart

module.exports.connectMongoDb = function () {
  const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  mongoose
    .connect(appConfig.db.uri, connectionParams)
    .then((data) => {
      console.log("Connected!");

      var obj = new orderModel({
        orderid: 2,
        products: [
          { name: "apple", barcode: "1234", qty: "2", price: "40" },
          { name: "mango", barcode: "4455", qty: "4", price: "80" },
        ],
        orderTotal: 120,
      });

      //### To save data in Product collection

      // obj.save((err, data) => {
      //   if(err){
      //     console.log("Error saving: ",err)
      //   }else
      //   {
      //     console.log("Data inserted!",data)
      //   }
      // });

      //### To fetch data in Product collection

      // productModel.findOne({barcode: "9780671652500"}, (err, data)=>{
      //     if(err){
      //           console.log("Error retrieving: ",err)
      //         }else
      //         {
      //           console.log("Data fetched!",data)
      //         }
      //   })
    })
    .catch((err) => {
      console.log("Error: ", err);
    });
};

module.exports.productModel = productModel;
module.exports.orderModel = orderModel;
module.exports.cartModel = cartModel;


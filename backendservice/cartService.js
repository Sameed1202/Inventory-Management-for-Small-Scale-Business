const mongoDbService = require("../backendservice/mongodbservice");
const bodyParser = require("body-parser");

exports.getAllCartServiceCall = (app) => {
  app.post("/addCartProduct", bodyParser.json(), (request, response) => {
    var filter = { barcode: request.body.barcode };

    let findProduct = mongoDbService.productModel.find(filter, (err, data) => {
      console.log("@@ data: ", data[0]);
      if (data[0]._id) {
        console.log("@@ data[0]._id: ", data[0]._id);
        let cart = new mongoDbService.cartModel({
          product: data[0]._id,
        });

        cart.save((err, resp) => {
          if (err) {
            console.log("\n@@ Error saving cart: ", err);
            return response.jsonp(err);
          } else {
            console.log("\n@@ Cart saved inserted! => ", resp);

            return response.jsonp(resp);
          }
        });
      } else {
        console.log("\n@@ Error data cart: ", err);
        return response.jsonp(err);
      }
    });
  });

  app.get("/getCartProducts", bodyParser.json(), (request, response) => {
    mongoDbService.cartModel
      .find({})
      .populate("product")
      .exec((err, data) => {
        if (err) return handleError(err);
        var products = [];
        data.map((x) => {
            x.product.quantity = 1,
          products = [...products, x.product];
        });

        var result = [];
        products.reduce(function(res, value) {
          if (!res[value.barcode]) {
            res[value.barcode] = { name:value.name,price:value.price,quantity: 0,barcode: value.barcode,_id: value._id};
            result.push(res[value.barcode])
          }
          res[value.barcode].quantity += value.quantity;
          return res;
        }, {});
        
        console.log("\n -------My products: ",result);

        console.log("\n @@ Final products: ",products);
        return response.jsonp(result);
      });
  });

  //###################################################################
  // ##### GET EMPTY CART 
  //###################################################################
  app.get("/emptyCart", bodyParser.json(), (request, response) => {
    mongoDbService.cartModel.remove((err, resp) => {
      if (err) {
        console.log("Error saving: ", err);
        return response.jsonp(err);
      } else {
        console.log("Empty Cart inserted! => ", resp);
  
        return response.jsonp(resp);
      }
    });
  });
  
};

const mongoDbService = require("../backendservice/mongodbservice");
const bodyParser = require("body-parser");

exports.getAllProductServiceCall = (app) => {
  app.get("/getProducts", bodyParser.json(), (request, response) => {
    mongoDbService.productModel.find({}, (err, data) => {
      if (err) {
        console.log("Error retrieving products: ", err);
        return response.err;
      } else {
        console.log("Products fetched!", data);
        return response.jsonp(data);
      }
    });
  });

  app.post("/addProduct", bodyParser.json(), (request, response) => {
    var query = { userid: request.body.inputvalue };

    if (
      request.body.name != null &&
      request.body.price != null &&
      request.body.quantity != null &&
      request.body.barcode != null
    ) {
      var lead = 2;
     
      (request.body.leadtime) ? ( lead = request.body.leadtime) : '';
      console.log("@@@ request.body.leadtime", request.body.leadtime);
      console.log("@@@ leadtime", lead);
      let obj = new mongoDbService.productModel({
        name: request.body.name,
        price: request.body.price,
        quantity: request.body.quantity,
        barcode: request.body.barcode,
        leadtime: lead
      });

      obj.save((err, resp) => {
        if (err) {
          console.log("Error saving: ", err);
          return response.jsonp(err);
        } else {
          console.log("Data inserted! => ", resp);

          return response.jsonp(resp);
        }
      });
    }
  });
  app.post("/deleteProduct", bodyParser.json(), (request, response) => {
    var filter = { barcode: request.body.barcode };

    if (request.body.barcode != null) {
      mongoDbService.productModel.findOneAndDelete(filter, (err, docs) => {
        if (err) {
          console.log(err);
          return response(err);
        } else {
          console.log("Deleted product : ", docs);
          return response.jsonp(docs);
        }
      });
    }
  });

  app.post("/updateProduct", bodyParser.json(), (request, response) => {
    var filter = { barcode: request.body.barcode };
    const updateParams = { new: true, useFindAndModify: false };

    let updatedProduct = {
      name: request.body.name,
      price: request.body.price,
      quantity: request.body.quantity,
      leadtime: request.body.leadtime,
    };

    if (
      request.body.name != null &&
      request.body.price != null &&
      request.body.quantity != null &&
      request.body.barcode != null
    ) {
      mongoDbService.productModel
        .findOneAndUpdate(filter, updatedProduct, updateParams)
        .then((data) => {
          if (data) {
            console.log("Data updated !", data);
            return response.jsonp(data);
          }
        });
    }
  });
};

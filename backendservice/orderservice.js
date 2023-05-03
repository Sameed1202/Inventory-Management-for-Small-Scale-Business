const mongoDbService = require("../backendservice/mongodbservice");
const bodyParser = require("body-parser");
const axios = require("axios");
const order = require("../schema/order");

const apiEndpoint = "http://localhost:7001";

function getStandardDeviation(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
}

function getMonthName(monthNumber) {
  const date = new Date();
  date.setMonth(Number(monthNumber) - 1);

  return date.toLocaleString("en-US", {
    month: "short",
  });
}

function formatDate(date) {
  var res =
    "" +
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1) +
    "-" +
    date.getDate();

  console.log("format date: ", res);

  return res;
}

function generateOrderId(date) {
  let now = date ? new Date(date).getTime().toString() : Date.now().toString();

  // pad with additional random digits
  if (now.length < 14) {
    const pad = 14 - now.length;
    now += randomNumber(pad);
  }

  // split into xxxx-xxxxxx-xxxx format
  return [now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join("-");
}

function randomNumber(length) {
  return Math.floor(
    Math.pow(10, length - 1) +
      Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)
  ).toString();
}

exports.getAllOrderServiceCall = (app) => {
  app.post("/addOrder", bodyParser.json(), (request, response) => {
    var query = { userid: request.body.inputvalue };
    var currentdate = new Date();

    var month = currentdate.getMonth() + 1;
    var hour = currentdate.getHours();

    month < 10 ? (month = "0" + month) : "";

    var date =
      "" +
      currentdate.getDate() +
      "/" +
      (currentdate.getMonth() + 1) +
      "/" +
      currentdate.getFullYear();

    var time =
      "" +
      currentdate.getHours() +
      ":" +
      currentdate.getMinutes() +
      ":" +
      currentdate.getSeconds();
    if (request.body.products != null && request.body.orderTotal != null) {
      let obj = new mongoDbService.orderModel({
        orderid: generateOrderId(),
        products: request.body.products,
        orderTotal: request.body.orderTotal,
        month: month,
        createdHour: hour,
        createdTime: time,
        createdDate: date,
      });
      // START ####### To Update Product qty in Inventory
      request.body.products.map((x) => {
        console.log(x.barcode);
        console.log("Cart product qty : ", x.quantity);

        const productToUpdate = mongoDbService.productModel.findOne(x.barcode);
        //console.log(productToUpdate.quantity);
        mongoDbService.productModel.findOne(
          { barcode: x.barcode },
          (err, data) => {
            if (err) {
              console.log("Error retrieving: ", err);
            } else {
              var productQty = data.quantity - x.quantity;
              var filter = { barcode: x.barcode };
              const updateParams = { new: true, useFindAndModify: false };
              let updatedProduct = {
                quantity: productQty,
              };
              if (data.quantity >= x.quantity) {
                mongoDbService.productModel
                  .findOneAndUpdate(filter, updatedProduct, updateParams)
                  .then((data) => {
                    if (data) {
                      console.log("Data updated !", data);
                      // return response.jsonp(data);
                    }
                  });
              }
            }
          }
        );
      });

      // END ####### To Update Product qty in Inventory
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
  //###################################################################
  // ##### GET MONTHLY REVENUE
  //###################################################################
  app.get("/getMonthlyRevenueData", bodyParser.json(), (request, response) => {
    var series = [];
    var categories = [];
    var responseData;

    var currMnth = new Date().getMonth() + 1;
    currMnth < 10 ? (currMnth = "0" + currMnth) : "";

    var currYear = new Date().getFullYear();

    console.log(currMnth);
    console.log(currYear);

    var queryMnthStart = currMnth - 6;
    var queryYearStart = currYear;
    var flag = false;

    if (queryMnthStart < 0) {
      queryMnthStart = 13 - Math.abs(queryMnthStart);
      queryYearStart--;
      flag = true;
    }
    queryMnthStart < 10 ? (queryMnthStart = "0" + queryMnthStart) : "";

    console.log(queryMnthStart);
    console.log(queryYearStart);

    var filter = {
      timestamp: {
        $gte: new Date(queryYearStart + "-" + queryMnthStart + "-" + "01"),
        $lte: new Date(currYear + "-" + currMnth + "-" + "31"),
      },
    };

    mongoDbService.orderModel
      .aggregate([
        {
          $match: filter,
        },

        {
          $group: {
            _id: "$month",
            monthTotal: {
              $sum: "$orderTotal",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .exec((err, data) => {
        console.log("\n@@@@ ##### Aggregation data:", data);

        data.map((x) => {
          if (Number(x._id) > currMnth) {
            series = [...series, Number(x.monthTotal.toFixed(2))];
            categories = [...categories, getMonthName(x._id)];
          }
        });

        data.map((x) => {
          if (Number(x._id) <= currMnth) {
            series = [...series, Number(x.monthTotal.toFixed(2))];
            categories = [...categories, getMonthName(x._id)];
          }
        });

        console.log("Series:", series);
        console.log("Categories:", categories);
        responseData = { series: series, categories: categories };

        console.log("Response Data:", responseData);

        return response.jsonp(responseData);
      });
  });

  //###################################################################
  // ##### GET HOURLY REVENUE DATA
  //###################################################################

  app.get("/getHourlyRevenueData", bodyParser.json(), (request, response) => {
    var series = [];
    var categories = [];
    var currentdate = new Date();
    var responseData;

    var todayDate =
      "" +
      currentdate.getFullYear() +
      "-" +
      (currentdate.getMonth() + 1) +
      "-" +
      currentdate.getDate();

    var tomDate =
      "" +
      currentdate.getFullYear() +
      "-" +
      (currentdate.getMonth() + 1) +
      "-" +
      (currentdate.getDate() + 1);

    console.log(todayDate);
    console.log(tomDate);
    var filter = {
      timestamp: {
        $gte: new Date(todayDate),
        $lt: new Date(tomDate),
      },
    };

    mongoDbService.orderModel
      .aggregate([
        {
          $match: filter,
        },

        {
          $group: {
            _id: "$createdHour",
            hourTotal: {
              $sum: "$orderTotal",
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .exec((err, data) => {
        console.log("\n@@@@ ##### Aggregation data:", data);

        data.map((x) => {
          series = [...series, Number(x.hourTotal.toFixed(2))];
          categories = [...categories, x._id + ":00"];
        });

        console.log("Series:", series);
        console.log("Categories:", categories);
        responseData = { series: series, categories: categories };

        console.log("Response Data:", responseData);

        return response.jsonp(responseData);
      });
  });

  //###################################################################
  // ##### GET TOP PRODUCTS
  //###################################################################

  app.get("/getTopProducts", bodyParser.json(), (request, response) => {
    mongoDbService.orderModel.find({}).exec((err, data) => {
      if (err) return handleError(err);

      var tempProducts = [];
      data.map((x) => {
        x.products.map((p) => {
          tempProducts = [...tempProducts, p];
        });
      });

      // console.log("temp PRoducts", tempProducts);

      var result = [];
      tempProducts.reduce(function (res, value) {
        if (!res[value.barcode]) {
          res[value.barcode] = {
            name: value.name,
            price: value.price,
            quantity: 0,
            barcode: value.barcode,
            _id: value._id,
          };
          result.push(res[value.barcode]);
        }
        res[value.barcode].quantity += value.quantity;
        return res;
      }, {});

      result.sort(function (a, b) {
        return b.quantity - a.quantity;
      });

      console.log("\n -------Final Top products: ", result);

      // console.log("\n @@ Final products: ", products);
      return response.jsonp(result);
    });
  });

  //###################################################################
  // ##### GET ORDERS DATA
  //###################################################################

  app.get("/getOrdersData", bodyParser.json(), (request, response) => {
    var currentdate = new Date();
    var responseData;
    var avgBasketSize = 0;

    var todayDate =
      "" +
      currentdate.getFullYear() +
      "-" +
      (currentdate.getMonth() + 1) +
      "-" +
      currentdate.getDate();

    var tomDate =
      "" +
      currentdate.getFullYear() +
      "-" +
      (currentdate.getMonth() + 1) +
      "-" +
      (currentdate.getDate() + 1);

    var filter = {
      timestamp: {
        $gte: new Date(todayDate),
        $lt: new Date(tomDate),
      },
    };

    mongoDbService.orderModel
      .aggregate([
        {
          $match: filter,
        },
        {
          $unwind: "$products",
        },
        {
          $group: {
            _id: "$orderid",
            count: {
              $sum: "$products.quantity",
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ])
      .exec((err, data) => {
        console.log("\n@@@@ ##### Aggregation data:", data);
        var totalCount = 0;
        data.map((x) => {
          totalCount += x.count;
        });
        if (totalCount > 0) {
          avgBasketSize = totalCount / data.length;
        }
        responseData = {
          todaysTotalOrderes: data.length,
          highestBasketSize: data[0]?.count,
          avgBasketSize: avgBasketSize.toFixed(2),
        };
        console.log("Response Data:", responseData);

        return response.jsonp(responseData);
      });
  });

  //###################################################################
  // ##### GET RP PRODUCT DATA
  //###################################################################
  app.get("/getReorderPoint", bodyParser.json(), (request, response) => {
    var currentdate = new Date();
    console.log("curr Date", currentdate);
    var responseData;
    var avgBasketSize = 0;

    var todayDate = formatDate(currentdate);

    var tomDate =
      "" +
      currentdate.getFullYear() +
      "-" +
      (currentdate.getMonth() + 1) +
      "-" +
      (currentdate.getDate() + 1);

    var dayAfterTomoDate =
      "" +
      currentdate.getFullYear() +
      "-" +
      (currentdate.getMonth() + 1) +
      "-" +
      (currentdate.getDate() + 2);

    console.log("tomo date: ", tomDate);

    // var filter = {
    //   timestamp: {
    //     $gte: formatDate(new Date(dateNew)),
    //     $lt: formatDate(new Date(tomDate)),
    //   },
    // };

    // #############################################################
    var filter;
    var d1 = new Date(tomDate);
    var d2 = new Date(tomDate);
    var toDate = new Date(dayAfterTomoDate);
    var dateNew;

    var orderProductsList;
    axios.get(apiEndpoint + "/getTopProducts").then(function (response) {
      orderProductsList = response.data;
      console.log("orderProductsList", orderProductsList);
    });

    var productsWeek = {
      week1: "",
      week2: "",
      week4: "",
      week5: "",
      week6: "",
      week7: "",
      week8: "",
      week9: "",
      week10: "",
      week11: "",
      week12: "",
    };
    console.log("todate", toDate);

    // Iterating for 12 Weeks
    for (let i = 0; i < 12; i++) {
      dateNew = d1.setDate(d1.getDate() - 7);
      filter = {
        timestamp: {
          $gte: new Date(dateNew),
          $lt: new Date(toDate),
        },
      };
      toDate = d2.setDate(d2.getDate() - 7);
      // console.log("Filter: ", filter);

      mongoDbService.orderModel
        .aggregate([
          {
            $match: filter,
          },
          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: "$products.name",
              count: {
                $sum: "$products.quantity",
              },
              barcode: { $first: "$products.barcode" },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ])
        .exec((err, data) => {
          switch (i) {
            case 0:
              productsWeek.week1 = data;
              break;
            case 1:
              productsWeek.week2 = data;
              break;
            case 2:
              productsWeek.week3 = data;
              break;
            case 3:
              productsWeek.week4 = data;
              break;
            case 4:
              productsWeek.week5 = data;
              break;
            case 5:
              productsWeek.week6 = data;
              break;
            case 6:
              productsWeek.week7 = data;
              break;
            case 7:
              productsWeek.week8 = data;
              break;
            case 8:
              productsWeek.week9 = data;
              break;
            case 9:
              productsWeek.week10 = data;
              break;
            case 10:
              productsWeek.week11 = data;
              break;
            case 11:
              productsWeek.week12 = data;
              break;
          }
        });
    }

    var inventoryProducts = [];
    var leadtime = 0;
    var finalRPArray = [];

    setTimeout(function () {
      var res = JSON.stringify(productsWeek);
      count = 0;
      orderProductsList.map((product) => {
        mongoDbService.productModel
          .findOne({ barcode: product.barcode })
          .exec((err, data) => {
            leadtime = data.leadtime;
            inventoryProducts = [...inventoryProducts, data];
            // console.log("\nProduct Name:", data.name);
            // console.log("leadtime", leadtime);

            var p1_arr = getProductAvgArray(product.barcode, res);
            var rp_num = getReorderPoint(p1_arr, leadtime);

            var reorder = data.quantity < rp_num;

            var rp_product = {
              name: data.name,
              barcode: data.barcode,
              current_qty: data.quantity,
              reorder_point: rp_num,
              should_reorder: reorder,
            };

            finalRPArray = [...finalRPArray, rp_product];
            count++;
            if (count == orderProductsList.length) {
              console.log("---@@-- Final Reorder Products list:", finalRPArray);
              return response.jsonp(finalRPArray);
            }
          });
      });
    }, 7000);
  });


};

function getProductAvgArray(barcode, res) {
  var data = JSON.parse(res);
  var temp;
  var final = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (let i = 1; i <= 12; i++) {
    temp = data["week" + i];

    temp.map((x) => {
      if (x.barcode == barcode) {
        final[i - 1] = x.count;
      }
    });
  }
  // console.log("\navg array >> ", final);
  return final;
}

function getReorderPoint(array, leadtime) {
  var s_deviation = getStandardDeviation(array);
  var avg = getAverage(array);

  var safety_stock = 1.64485 * Math.sqrt(leadtime) * s_deviation;

  var reorder_point = safety_stock + avg * leadtime;

  // console.log("\n @@ mean", avg);
  // console.log("\n @@ s_deviation", s_deviation);
  // console.log("\n @@ safety_stock", safety_stock);
  // console.log("\n @@ reorder_point", reorder_point);

  return Math.round(reorder_point);
}

function getAverage(array) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;

  return mean;
}

function getProductDetails(bcode) {
  mongoDbService.productModel.findOne({ barcode: bcode }).exec((err, data) => {
    leadtime = data.leadtime;

    console.log("FUNC() data", data);
    console.log("FUNC() data.leadtime", data.leadtime);
    return data;
  });
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
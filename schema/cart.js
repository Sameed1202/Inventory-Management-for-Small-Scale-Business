"use strict";

/**
 * Module Dependencies
 */
const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

let cartSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'product'},
});

module.exports = mongoose.model("cart", cartSchema);

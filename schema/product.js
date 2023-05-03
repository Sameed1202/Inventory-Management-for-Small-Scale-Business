'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

  let productSchema = new Schema({
    
      name: {
        type: String,
        default: ''
      },
      price: {
        type: String,
        default: '0'
      },
      quantity: {
        type: Number,
        default: 0
      },
      barcode: {
        type: String,
        index: true,
        unique: true,
        default: ''
      },
      leadtime: {
        type: Number,
        default: 2
      },
  })

  module.exports = mongoose.model('product', productSchema);
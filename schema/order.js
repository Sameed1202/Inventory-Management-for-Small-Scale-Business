'use strict'

const { Number } = require('mongoose');

/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

  let orderSchema = new Schema({
    
      orderid: {
        type: String,
        unique: true,
        auto: true
      },
      products: {
        type: Array,
        default:[]
      },
      orderTotal: {
        type: Number,
        default: 0
      },
      timestamp: {
        type: Date,
        default:  Date.now

      },
      createdDate: {
        type: String,
        default: ''
      },
      createdTime: {
        type: String,
        default: ''
      },

      month: {
        type: String,
        default: ''
      },
      createdHour: {
        type: String,
        default: ''+(new Date()).getHours()
      }
  })

  module.exports = mongoose.model('order', orderSchema);
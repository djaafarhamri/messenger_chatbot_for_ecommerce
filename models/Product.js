const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    quantity: {
        type: Number,
        default: 1
    },
    price: {
      type: Number,
      required: true,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "products" }
);

const model = mongoose.model("ProductSchema", productSchema);

module.exports = model;

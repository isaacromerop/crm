const User = require("../models/User");
const Product = require("../models/Product");
const Client = require("../models/Client");
const Purchase = require("../models/Purchase");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isValidObjectId, Mongoose } = require("mongoose");
require("dotenv").config({ path: "variables.env" });

//create token function
const createToken = (user, secret, expiresIn) => {
  const { id, name, lastName, email } = user;
  return jwt.sign({ id, name, lastName }, secret, { expiresIn });
};

// resolvers

const resolvers = {
  Query: {
    getUser: async (_, {}, ctx) => {
      return ctx.user;
    },
    getProducts: async () => {
      try {
        const products = await Product.find({});
        return products;
      } catch (error) {
        console.log(error);
      }
    },
    getProduct: async (_, { id }) => {
      // check if product exists
      if (!isValidObjectId(id)) {
        throw new Error("Product does not exixts.");
      }
      const productExists = await Product.findById(id);
      return productExists;
    },
    getClients: async () => {
      try {
        const clients = await Client.find({});
        return clients;
      } catch (error) {
        console.log(error);
      }
    },
    getSellerClients: async (_, {}, ctx) => {
      try {
        const sellerClients = await Client.find({
          seller: ctx.user.id.toString(),
        });
        return sellerClients;
      } catch (error) {
        console.log(error);
      }
    },
    getClient: async (_, { id }, ctx) => {
      //check if client exists
      if (!isValidObjectId(id)) {
        throw new Error("Client does not exists.");
      }
      const client = await Client.findById(id);
      //check if is a valid seller
      if (ctx.user.id.toString() !== client.seller.toString()) {
        throw new Error("You do not have permissions to see this client.");
      }
      return client;
    },
    getPurchases: async () => {
      try {
        const purchases = await Purchase.find({});
        return purchases;
      } catch (error) {
        console.log(error);
      }
    },
    getSellerPurchases: async (_, {}, ctx) => {
      try {
        const sellerPurchases = await Purchase.find({
          seller: ctx.user.id.toString(),
        }).populate("client");
        return sellerPurchases;
      } catch (error) {
        console.log(error);
      }
    },
    getPurchase: async (_, { id }, ctx) => {
      //check if purchase exists
      if (!isValidObjectId(id)) {
        throw new Error("Purchase does not exists.");
      }
      //check if is seller's client
      const purchase = await Purchase.findById(id);
      if (purchase.seller.toString() !== ctx.user.id.toString()) {
        throw new Error("You do not have permissions to see this purchase.");
      }
      return purchase;
    },
    getPurchasesByStatus: async (_, { status }, ctx) => {
      //check if is seller's client
      const purchases = await Purchase.find({ seller: ctx.user.id, status });
      return purchases;
    },
    topClients: async () => {
      const clients = await Purchase.aggregate([
        { $match: { status: "Completed" } },
        {
          $group: {
            _id: "$client",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client",
          },
        },
        { $limit: 10 },
        {
          $sort: { total: -1 },
        },
      ]);
      return clients;
    },
    topSellers: async () => {
      const seller = await Purchase.aggregate([
        { $match: { status: "Completed" } },
        {
          $group: {
            _id: "$seller",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $limit: 3 },
        { $sort: { total: -1 } },
      ]);
      return seller;
    },
    lookProduct: async (_, { text }) => {
      const products = await Product.find({
        name: { $regex: new RegExp(text) },
      });
      return products;
    },
  },
  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password } = input;
      //validate if user is already registered
      const userExists = await User.findOne({ email });
      if (userExists) {
        throw new Error("User already registered.");
      }
      //hash password
      const salt = await bcryptjs.genSaltSync(10);
      input.password = bcryptjs.hashSync(password, salt);
      //save into db
      try {
        const user = new User(input);
        user.save();
        return user;
      } catch (error) {
        console.log(error);
      }
    },
    userAuth: async (_, { input }) => {
      const { email, password } = input;
      // check if user exists
      const userExists = await User.findOne({ email });
      if (!userExists) {
        throw new Error("User does not exists.");
      }
      //check if password is correct
      const correctPassword = await bcryptjs.compare(
        password,
        userExists.password
      );
      if (!correctPassword) {
        throw new Error("Incorrect Password.");
      }
      //create token
      return {
        token: createToken(userExists, process.env.SECRET, "24h"),
      };
    },
    newProduct: async (_, { input }) => {
      try {
        const newProduct = new Product(input);
        //save into db
        const product = await newProduct.save();
        return product;
      } catch (error) {
        console.log(error);
      }
    },
    updateProduct: async (_, { id, input }) => {
      //check if product exists
      if (!isValidObjectId(id)) {
        throw new Error("Product does not exists.");
      }
      //save into db
      const product = await Product.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return product;
    },
    deleteProduct: async (_, { id }) => {
      //check if product exists
      if (!isValidObjectId(id)) {
        throw new Error("Product does not exists.");
      }
      //delete from db
      await Product.findOneAndDelete({ _id: id });
      return "Product removed successfully.";
    },
    newClient: async (_, { input }, ctx) => {
      //check if client exists
      const { email } = input;
      const clientExists = await Client.findOne({ email });
      if (clientExists) {
        throw new Error("Client already registered.");
      }
      //assign seller
      const newClient = new Client(input);
      newClient.seller = ctx.user.id;

      //save into db
      try {
        const client = await newClient.save();
        return client;
      } catch (error) {
        console.log(error);
      }
    },
    updateClient: async (_, { id, input }, ctx) => {
      //check if client exists
      if (!isValidObjectId(id)) {
        throw new Error("Client does not exists.");
      }
      const client = await Client.findById(id);
      if (client.seller.toString() !== ctx.user.id.toString()) {
        throw new Error(
          "You do not have permissions to manipulate this client."
        );
      }
      const updateClient = await Client.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return updateClient;
    },
    deleteClient: async (_, { id }, ctx) => {
      //check if client exists
      if (!isValidObjectId(id)) {
        throw new Error("Client does not exists.");
      }
      const client = await Client.findById(id);
      //check if is seller's client
      if (client.seller.toString() !== ctx.user.id.toString()) {
        throw new Error("You do not have permissions to delete this client.");
      }
      //delete from db
      await Client.findOneAndDelete({ _id: id });
      return "Client deleted successfully.";
    },
    newPurchase: async (_, { input }, ctx) => {
      //check if client exists
      if (!isValidObjectId(input.client)) {
        throw new Error("Client does not exists.");
      }
      //check if is a seller's client
      const client = await Client.findById(input.client);
      if (client.seller.toString() !== ctx.user.id.toString()) {
        throw new Error("You do not have permissions on this client.");
      }
      //check if quantity is less than stock
      for await (item of input.items) {
        const { id } = item;
        const product = await Product.findById(id);
        if (item.quantity > product.stock) {
          throw new Error(
            `Requested quantity of ${product.name}, exceeds stock. Only ${product.stock} units available`
          );
        } else {
          product.stock = product.stock - item.quantity;
          await product.save();
        }
      }
      //create new purchase
      const purchase = new Purchase(input);
      //assign a seller
      purchase.seller = ctx.user.id;
      //save into db
      try {
        const newPurchase = await purchase.save();
        return newPurchase;
      } catch (error) {
        console.log(error);
      }
    },
    updatePurchase: async (_, { id, input }, ctx) => {
      //check if purchase exists
      if (!isValidObjectId(id)) {
        throw new Error("Purchase does not exists.");
      }
      //check if is seller's purchase
      const purchase = await Purchase.findById(id);
      if (purchase.seller.toString() !== ctx.user.id.toString()) {
        throw new Error("You do not have permissions to update this purchase.");
      }
      //check if client exists
      if (!isValidObjectId(input.client)) {
        throw new Error("Client does not exists.");
      }
      //check stock
      if (input.items) {
        for await (item of input.items) {
          const { id } = item;
          const product = await Product.findById(id);
          if (item.quantity > product.stock) {
            throw new Error(
              `Requested quantity of ${product.name}, exceeds stock. Only ${product.stock} units available`
            );
          } else {
            product.stock = product.stock - item.quantity;
            await product.save();
          }
        }
      }
      //update purchase
      const updatedPurchase = await Purchase.findOneAndUpdate(
        { _id: id },
        input,
        { new: true }
      );
      return updatedPurchase;
    },
    deletePurchase: async (_, { id }, ctx) => {
      //check if purchase exists
      if (!isValidObjectId(id)) {
        throw new Error("Purchase does not exists.");
      }
      //check if is seller's client
      const purchase = await Purchase.findById(id);
      if (purchase.seller.toString() !== ctx.user.id) {
        throw new Error("You do not have permissions to delete this purchase.");
      }
      //delete purchase
      try {
        await Purchase.findOneAndDelete({ _id: id });
        return "Purchase deleted successfully.";
      } catch (error) {
        console.log(error);
      }
    },
  },
};

module.exports = resolvers;

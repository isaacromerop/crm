const { AddArgumentsAsVariables } = require("apollo-server");
const mongoose = require("mongoose");
require("dotenv").config({ path: "variables.env" });


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('Connected to CRMGraphQL');
    } catch (error) {
        console.log('Error occurred.');
        console.log(error);
        process.exit(1) // stop the app
    }
}

module.exports = connectDB;
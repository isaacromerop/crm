const { gql } = require("apollo-server");

// schema

const typeDefs = gql`
  type User {
    id: ID
    name: String
    lastName: String
    email: String
    created: String
  }
  type Token {
    token: String
  }
  type Product {
    id: ID
    name: String
    stock: Int
    price: Float
    created: String
  }
  type Client {
    id: ID
    name: String
    lastName: String
    email: String
    phone: String
    company: String
    created: String
    seller: ID
  }
  type Purchase {
    id: ID
    items: [ItemsGroup]
    total: Float
    client: Client
    seller: ID
    created: String
    status: PurchaseStatus
  }
  type ItemsGroup {
    id: ID
    quantity: Int
    name: String
    price: Float
  }
  type TopClients {
      total: Float
      client: [Client]
  }
  type TopSellers {
      total: Float
      seller: [User]
  }

  input UserInput {
    name: String!
    lastName: String!
    email: String!
    password: String!
  }
  input AuthInput {
    email: String!
    password: String!
  }
  input ProductInput {
    name: String!
    stock: Int!
    price: Float!
  }
  input ClientInput {
    name: String!
    lastName: String!
    email: String!
    phone: String
    company: String!
  }
  input ItemsProductInput {
    id: ID
    quantity: Int
    name: String
    price: Float
  }
  input PurchaseInput {
    items: [ItemsProductInput]
    total: Float!
    client: ID!
    status: PurchaseStatus
  }

  enum PurchaseStatus {
    Pending
    Completed
    Cancelled
  }

  type Query {
    # Users Queries
    getUser: User

    # Products Queries
    getProducts: [Product]
    getProduct(id: ID!): Product

    # Client Queries
    getClients: [Client]
    getSellerClients: [Client]
    getClient(id: ID!): Client

    # Purchases Queries
    getPurchases: [Purchase]
    getSellerPurchases: [Purchase]
    getPurchase(id: ID!): Purchase
    getPurchasesByStatus(status: String!): [Purchase]

    # Advanced Queries
    topClients: [TopClients]
    topSellers: [TopSellers]
    lookProduct(text: String!): [Product]
  }

  type Mutation {
    # Users Mutations
    newUser(input: UserInput): User
    userAuth(input: AuthInput): Token

    # Products Mutations
    newProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): String

    # Clients Mutations
    newClient(input: ClientInput): Client
    updateClient(id: ID!, input: ClientInput): Client
    deleteClient(id: ID!): String

    # Purchases Mutations
    newPurchase(input: PurchaseInput): Purchase
    updatePurchase(id: ID!, input: PurchaseInput): Purchase
    deletePurchase(id: ID!): String
  }
`;

module.exports = typeDefs;

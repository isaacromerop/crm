const mongoose = require('mongoose');

const PurchaseSchema = mongoose.Schema({
    items: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Client'
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    created: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: String,
        default: 'Pending'
    }
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
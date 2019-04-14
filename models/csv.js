// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var Schema = mongoose.Schema({
    item_id: String,
    date_added: String,
    created_on: {
        type: Date,
        default: new Date()
    },
    updated_on: Date
}, {
    usePushEach: true
});

Schema.pre('save', function (next) {
    this.updated_on = Date.now();
    next();
});

// create the model for users and expose it to our app
module.exports = mongoose.model('CSV', Schema);
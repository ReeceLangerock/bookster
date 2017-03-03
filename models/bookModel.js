const mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

var bookSchema = mongoose.Schema({
    '_id': String,
    'title': String,
    'author': String,
    'bookImageURL': String,
    'isbn13': String,
    'ownedBy': [String]

});

bookSchema.methods.newBook = function(id, data, userId){
  var newBook = new bookModel({
    '_id': id,
    'title': data.bookTitle,
    'author': data.bookAuthor,
    'bookImageURL': data.bookImageUrl,
    'isbn13': data.bookID,
    'ownedBy': [userId]
  });

  newBook.save(function(err){
    if(err){
      throw err;
    }
    else{
      return 'success';
    }
  })
}

var bookModel = mongoose.model('book', bookSchema, 'books');
module.exports = bookModel;

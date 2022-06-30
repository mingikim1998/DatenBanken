const express = require('express');
const server = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const { appendFile } = require('fs');
const { application } = require('express');


// Middleware
server.use(bodyParser.json()); //정확히 뭘 하는지 모르겠다
server.use(methodOverride('_method'));  

// Mongo URI    
const mongoURI = "mongodb+srv://mingi:mingi@cluster0.0ct4j.mongodb.net/test";

// Mongo Connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () =>{
    gfs = Grid(conn.db, mongoose.mongo); // mongoose.mongo
    //gfs.collection('uploads');
});

const storage = new GridFsStorage({
  url: mongoURI,
  cache: true, // cache
  file: (req, file) => {
    return file.originalname + Date.now();
  }
});

const upload = multer({ storage });

  // @rout GET /
  // @desc Loads from
  server.get("/upload", (req,res) =>{
      res.render('upload');
  });


  // @route POST /upload
  // @desc uploads file to DB
  server.post('/upload', upload.single('file'), (req, res) => {
    res.redirect("/");
  });

// register view engine
server.set('view engine', 'ejs'); 

let port = 3000;
server.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});

server.get('/', (req,res) => {
    const files = []; 
    res.render('index', {title : 'HOME', files});
});


// const db = client.db(dbName);
// const bucket = new mongodb.GridFSBucket(db);
// require('./controller/controller')(this.controller);
// module.exports = { controller };

server.get('/list', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.render('list', { files: false });
      } else {
        files.map(file => {
          if (
            file.contentType === 'png'
          ) {
            file.isPdf = true; 
          }
        });
        res.render('list', { files: files });
      }
    });
  });

// @route DELETE /files/:id
// server.delete((req, res) => {
//   db.test.deleteOne( {"_id": file._id}); // db.test_users. ?? why users
// });

// server.post('/files/del/:id', (req, res) => {
//   gfs.remove({ _id: file._id, root: "uploads" }, (err, gridStore) => {
//            if (err) {
//                return res.status(404).json({ err });
//            }
//            return;

//        });
// });

// server.get(mongoURI, function(req, res){
//   const file = {"_id": file._id};
//   res.download(file);
// });

module.exports.getFile = (req, res) => {
  //Accepting user input directly is very insecure and should 
  //never be allowed in a production app. Sanitize the input.
  let fileName = req.body.text1;
  //Connect to the MongoDB client
  MongoClient.connect(url, function(err, client){

    if(err){
      return res.render('index', {title: 'Uploaded Error', message: 'MongoClient Connection error', error: err.errMsg});
    }
    const db = client.db(dbName);
    
    const collection = db.collection('fs.files');
    const collectionChunks = db.collection('fs.chunks');
    collection.find({filename: fileName}).toArray(function(err, docs){
      if(err){
        return res.render('index', {title: 'File error', message: 'Error finding file', error: err.errMsg});
      }
      if(!docs || docs.length === 0){
        return res.render('index', {title: 'Download Error', message: 'No file found'});
      }else{
        //Retrieving the chunks from the db
        collectionChunks.find({files_id : docs[0]._id}).sort({n: 1}).toArray(function(err, chunks){
          if(err){
            return res.render('index', {title: 'Download Error', message: 'Error retrieving chunks', error: err.errmsg});
          }
          if(!chunks || chunks.length === 0){
            //No data found
            return res.render('index', {title: 'Download Error', message: 'No data found'});
          }
          //Append Chunks
          let fileData = [];
          for(let i=0; i<chunks.length;i++){
            //This is in Binary JSON or BSON format, which is stored
            //in fileData array in base64 endocoded string format
            fileData.push(chunks[i].data.toString('base64'));
          }
          //Display the chunks using the data URI format
          let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
          res.render('imageView', {title: 'Image File', message: 'Image loaded from MongoDB GridFS', imgurl: finalFile});
        });
      }
      
    });
  });
};
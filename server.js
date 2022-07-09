const express = require('express');
const server = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const {fs} = require('fs');



// Middleware
server.use(bodyParser.json());
server.use(methodOverride('_method'));  

// Mongo URI    
const mongoURI = "mongodb+srv://mingi:mingi@cluster0.0ct4j.mongodb.net/test";

// Mongo Connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () =>{
    gfs = Grid(conn.db, mongoose.mongo);
    //gfs.collection('uploads');
});

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1;
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

var date = new Date();
date.yyyymmdd(); // date in format

const storage = new GridFsStorage({
  url: mongoURI,
  cache: true, // cache
  file: (req, file) => {
    return file.originalname + date.yyyymmdd();
  }
});


const maxSize = 10 * 1024 * 1024; // upload size limit
const upload = multer({ storage });


server.get("/upload", (req,res) =>{
  res.render('upload');
});
 
server.post('/upload', upload.single('file'), (req, res) => {
  res.redirect("/");
});


// register view engine
server.set('view engine', 'ejs'); 

module.exports = server;

let port = 3000;
server.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});

server.get('/', (req,res) => {
    const files = []; 
    res.render('index', {title : 'HOME', files});
});


server.get('/list', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.render('list', { files: false });
      } else {
        res.render('list', { files: files });
      }
    });
  });


server.get('/download:file_id', function(req , res) {
  var file_id = (req.params.file_id);
  gfs.files.find({_id: file_id}).toArray(function (err, files) { //_id: files_id
    if (err) {
      res.json(err);
    }
    if (files.length > 0) {
      var mime = files[0].contentType;
      var filename = files[0].filename;
      res.set('Content-Type', mime);
      res.set('Content-Disposition', "attachment; filename=" + filename);
      var read_stream = gfs.createReadStream({_id: file_id});
      read_stream.pipe(res); 

    } else {
      res.json(file_id+ '  This file does not exist.'); 
    }
  });
});

server.use((req, res) => { // default
      res.render("404");
  });

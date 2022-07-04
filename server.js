const express = require('express');
const server = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
// const { appendFile } = require('fs');
const {fs} = require('fs');
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

server.get("/upload", (req,res) =>{
  res.render('upload');
});

// const { promisify } = require('util');
// const unlinkAsync = promisify(fs.unlink);

// @rout delete/
// server.post('/delete', upload, async (req, res) =>{
//   // You aren't doing anything with data so no need for the return value
//   await uploadToRemoteBucket(req.file.path)

//   // Delete the file like normal
//   await unlinkAsync(req.file.path)

//   res.end("UPLOAD COMPLETED!")
// })

// server.post('/delete', upload.single('file'), (req, res) => {
//   res.redirect("/");
// });


// @route POST /upload
server.post('/upload', upload.single('file'), (req, res) => {
  res.redirect("/");
});

// server.post('/upload', function(req, res) {
//   var dirname = require('path').dirname(__dirname);
//   var filename = req.file.filename;
//   var path = req.file.path;
//   var type = req.file.mimetype;
//   var read_stream =  fs.createReadStream(dirname + '/' + path);

//   var writestream = gfs.createWriteStream({
//       _id:  filename,
//     'filename': req.file.filename,
//      mode: 'w',
//      content_type: type
//   });
//   read_stream.pipe(writestream);

//   writestream.on('close', function (file) {
//      res.status(200).json({'filename': filename});
//    });
// });



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


server.get('/:file_id', function(req , res) {
  var file_id = req.params.file_id;
  gfs.files.find({_id: file_id}).toArray(function (err, files) {
    if (err) {
      res.json(err);
    }
    if (files.length > 0) {
      var mime = files[0].contentType;
      var filename = files[0].filename;
      res.set('Content-Type', mime);
      res.set('Content-Disposition', "inline; filename=" + filename);
      var read_stream = gfs.createReadStream({_id: file_id});
      read_stream.pipe(res);
    } else {
      res.json(file_id+ '  This file does not exist.');
    }
  });
});
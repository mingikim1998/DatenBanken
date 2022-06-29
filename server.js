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
server.use(bodyParser.json());
server.use(methodOverride('_method'));  

// server.post(
//   accessControlMiddleWare,
//   parseJsonMiddleWare,
//  (req,res,next)=>{
//   //server deals with db
//  });

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
    return 'file_' + Date.now();
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
server.delete((req, res) => {
  db.test_users.deleteOne( {"_id": ObjectId("bded1e47b6a3be3837cdf1b62ef0ccde")});
  // gfs.remove(options, function (err, gridStore) {
  //   if (err) return handleError(err);
  //   console.log('success');
  // });
});


// server.get('/download', async (req, res) => {
//   var id = "<file_id_xyz>";
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection("<name_of_collection>").findOne({ "_id": mongodb.ObjectId(id) }, (err, file) => {
//       if (err) {
//           // report the error
//           console.log(err);
//       } else {
//           // detect the content type and set the appropriate response headers.
//           let mimeType = file.contentType;
//           if (!mimeType) {
//               mimeType = mime.lookup(file.filename);
//           }
//           res.set({
//               'Content-Type': mimeType,
//               'Content-Disposition': 'attachment; filename=' + file.filename
//           });

//           const readStream = gfs.createReadStream({
//               _id: id
//           });
//           readStream.on('error', err => {
//               // report stream error
//               console.log(err);
//           });
//           // the response will be the file itself.
//           readStream.pipe(res);
//       }
//   })});
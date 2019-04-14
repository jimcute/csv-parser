var express = require('express');
var fs = require('fs'),
  es = require('event-stream');
const {
  Parser
} = require('json2csv');
var router = express.Router();
var CSVModel = require('../models/csv');
var multer = require('multer')
var upload = multer({
  dest: 'uploads/'
})

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'CSV Uploader Sample'
  });
});

router.post('/', upload.single('file'), function (req, res) {
  var lineNr = 0;

  var bulkUpdateCallback = function (err, r) {
    console.log(r.matchedCount);
    console.log(r.modifiedCount);
  }
  // Initialise the bulk operations array
  var bulkUpdateOps = [],
    counter = 0;

  var s = fs.createReadStream(req.file.path)
    .pipe(es.split())
    .pipe(es.mapSync(function (line) {

        // pause the readstream
        s.pause();

        lineNr += 1;

        if (line.indexOf('item_id') < 0) {
          var itemId;
          var dateAdded = new Date().getMonth() + 1 + '-' + new Date().getDate() + '-' + new Date().getFullYear();
          var dateAddedOld;
          if (line.indexOf(',') > -1) {
            itemId = line.split(',')[0];
            dateAddedOld = line.split(',')[1];
          } else itemId = line;

          bulkUpdateOps.push({
            "updateOne": {
              "filter": {
                "item_id": itemId
              },
              "update": {
                "$set": {
                  "item_id": itemId,
                  "date_added": dateAdded
                }
              },
              upsert: true
            }
          });
        }

        // resume the readstream, possibly from a callback
        s.resume();
      })
      .on('error', function (err) {
        console.log('Error while reading file.', err);
      })
      .on('end', function () {
        console.log('Read entire file.');
        var dateAdded = new Date().getMonth() + 1 + '-' + new Date().getDate() + '-' + new Date().getFullYear();

        CSVModel.bulkWrite(bulkUpdateOps, {
          "date_added": dateAdded,
        }, bulkUpdateCallback);
        bulkUpdateOps = []; // re-initialize

        res.render('index', {
          title: 'CSV Uploader Sample',
          message: 'CSV Uploaded and Updated data with existing data successfully!'
        })
      })
    );
})

router.get('/download-csv', (req, res) => {
  CSVModel.find({}, (err, docs) => {
    if (err) {
      return res.send();
    }

    const fields = ['item_id', 'date_added'];
    const json2csvParser = new Parser({
      fields
    });
    const csv = json2csvParser.parse(docs);
    res.setHeader('Content-disposition', 'attachment; filename=data.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  })
})

module.exports = router;
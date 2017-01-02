'use strict';
var fs = require('fs');

module.exports = {
    parseXmlFile: function (filename) {
        fs.readFile(filename, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }
            console.log(data);
        });
    }
};


var path = require('path');
var index = require('./lib/index');
var fs = require('fs');
var fsextra = require('fs-extra');
var cheerio = require('cheerio');
var pretty = require('pretty');
var parseString = require('xml2js').parseString;
var entities = require('html-entities');
var sanitizeHtml = require('sanitize-html');
var debugOutputString = '';

var rootDirectory = 'c:\\users\\bradyg\\source\\bradygblog\\fs\\site\\wwwroot';
var directory = 'c:\\users\\bradyg\\source\\bradygblog\\fs\\site\\wwwroot\\posts\\';
var outputDirectory = 'C:\\Users\\bradyg\\Source\\miniblog-markdowner\\output\\';

fs.readdirSync(directory).forEach((file, index, arr) => {
    if (fs.statSync(directory + file).isFile()) {
        parseString(fs.readFileSync(directory + file).toString(), (err, result) => {
            var output = '';

            // add to the debug output string
            debugOutputString = 'processing blog #' + (index + 1) + ' of ' + arr.length + ' - ';
            debugOutputString += result.post.slug[0].toLowerCase();
            console.log(debugOutputString);

            // start the metadata header
            output += '---\n';
            output += 'title: ' + result.post.title[0] + '\n';
            output += 'slug: ' + result.post.slug[0].toLowerCase() + '\n';
            output += 'author: ' + result.post.author[0] + '\n';
            output += 'lastModified: ' + result.post.lastModified[0] + '\n';
            output += 'pubDate: ' + result.post.pubDate[0];
            if (result.post.categories.length > 0) {
                output += '\n';
                output += 'categories: ';

                var categoryText = '';
                if (result.post.categories[0].category.length > 0) {
                    result.post.categories[0].category.forEach((category) => {
                        categoryText += category + ',';
                    });
                    if (categoryText.endsWith(','))
                        categoryText = categoryText.substring(0, categoryText.length - 1);
                    output += categoryText;
                }
            }
            output += '\n---\n\n';

            // start the html content
            var htmlContent = result.post.content[0];
            htmlContent = new entities.AllHtmlEntities().decode(htmlContent);
            htmlContent = pretty(htmlContent);
            htmlContent = sanitizeHtml(htmlContent, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe']),
                allowedAttributes: {
                    'img': ['alt', 'src'],
                    'iframe': ['*']
                }
            });

            debugOutputString = '';

            // find and fix the img tags
            var $ = cheerio.load(htmlContent);
            $('img').each((index, element) => {
                if ($(element).attr('src')) {
                    $(element).attr('src', $(element).attr('src')
                        .replace('http://www.bradygaster.com', '')
                        .replace('http://bradygaster.com', ''));
                        
                    var src = $(element).attr('src');
                    if (!src.startsWith('http') && !src.startsWith('/image.axd')) {
                        src = src.replace(/\//g, '\\');
                        newSrc = '/posts/' + result.post.slug[0].toLowerCase() + '/media/' + path.basename(src);
                        newSrc = newSrc.replace(/\\/g, '/');
                        $(element).attr('src', newSrc);
                        try {
                            fsextra.copySync(
                                rootDirectory + src,
                                outputDirectory + result.post.slug[0].toLowerCase() + '\\media\\' + path.basename(src)
                            );
                        }
                        catch (err) {
                            console.log(err);
                        }
                    }
                }
            });
            htmlContent = $.html();

            // add the html to the output buffer
            output += htmlContent;
            output += '\n';

            console.log(debugOutputString);

            // write out the output to a new index.md file
            var indexMdFilename = outputDirectory + result.post.slug[0].toLowerCase() + '\\index.md';
            fsextra.createFileSync(indexMdFilename);
            fsextra.writeFileSync(indexMdFilename, output);
        });
    }
});
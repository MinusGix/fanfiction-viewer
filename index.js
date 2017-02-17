/* jshint esversion: 6 */
var express = require('express'),
    fs = require('fs'),
    jsdom = require('jsdom'),
    request = require('request'),
    url = require('url'),
    app = express(),
    jQuery = fs.readFileSync(__dirname + '/client/jquery.js', 'utf8');

app.set('view engine', 'ejs');
app.set('views', 'client')

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function(s) {
        return entityMap[s];
    });
}

app.get('/', (req, res) => {
    res.render('index');
});
app.get(/\/url\/fanfiction\/.*/i, (req, res) => {
    if (req.path.match(/\/\d+/g).length === 1) {
        res.redirect(req.path + (req.path[req.path.length - 1] === '/' ? '' : '/') + '1/');
    } else {
        var path = req.path.replace(/\/url\/fanfiction\//i, '').split('/');
        jsdom.env({
            url: `https://www.fanfiction.net/s/${path[0]}/${path[1]||1}/`,
            src: [jQuery],
            done: (err, window) => {
                var $ = window.jQuery;
                var storytext = [];
                $('#storytext > p').each((a, b, c) => {
                    storytext.push($(b).text());
                });
                var st = $('#pre_story_links');
                var chapters = [];
                $('#chap_select').children('option').each(function(a, b, c) {
                    chapters.push($(b).text());
                });
                res.render(
                    'storyview', {
                        title: $('title').text(),
                        text: storytext,
                        storytype: $(st.children('.lc-left').children('a.xcontrast_txt')[0]).text() + ' > ' + $(st.children('.lc-left').children('a.xcontrast_txt')[1]).text(),
                        storytitle: $('#profile_top').children('b.xcontrast_txt').text(),
                        author: $($('#profile_top').children('a.xcontrast_txt')[0]).text(),
                        description: $('#profile_top').children('div.xcontrast_txt').text(),
                        extras: $('#profile_top').children('span.xcontrast_txt.xgray').text(),
                        chapters
                    }
                );
            }
        });
    }
});
app.get('/jquery.js', (req, res) => {
    res.send(fs.readFileSync(__dirname + '/client/jquery.js', 'utf8'));
});
app.get('/styles.css', (req, res) => {
    res.setHeader('content-type', 'text/css')
    res.send(fs.readFileSync(__dirname + '/client/styles.css', 'utf8'));
});

app.listen(3000, () => console.log("Server started on localhost:3000"));
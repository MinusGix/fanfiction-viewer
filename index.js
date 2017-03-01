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
app.get(/\/url\/ao3\/.*/i, (req, res) => {
    var path = req.path.replace(/\/url\/ao3\//i, '').split('/');
    jsdom.env({
        url: `http://archiveofourown.org/works/${path[0]}/chapters/${path[1]}/`,
        src: [jQuery],
        done: (err, window) => {
            let $ = window.jQuery,
                storytext = [],
                chapters = [];
            $('#selected_id > option').each((a, b) => {
                chapters.push([$(b).attr('value'), $(b).text()]);
            });
            tpush = (...vals) => storytext.push(...(vals.map((v) => v)));
            tpush($('.chapter.preface.group > h3.title').text());
            tpush($('.chapter.preface.group > #summary').text());
            tpush($('.chapter.preface.group > #notes').text());
            $('div#chapters > div.chapter .userstuff.module > p').each((a, b) => {
                tpush($(b).text());
            });
            tpush($('div.chapter.preface.group > div.end.notes.module').text());

            var ext = [],
                $e = $('.work.meta.group');
            $e.children('*').each((a, b) => {
                if (a % 2 === 0) {
                    ext.push([$(b).text().trim()]);
                } else {
                    var ext2 = [];
                    $(b).has('ul').children('ul').children('li').each((c, d) => {
                        ext2.push($(d).text());
                    });
                    $(b).has('dl.stats').children('dl.stats').children('*').each((c, d) => {
                        if (c % 2 === 0) {
                            ext2.push($(d).text());
                        } else {
                            ext2[ext2.length - 1] += ' ' + $(d).text();
                        }
                    });
                    if (ext2.length === 0) ext2 = [$(b).text().trim()]
                    ext[ext.length - 1].push(ext2);
                }
            });
            var extText = '';
            for (var i = 0; i < ext.length; i++) {
                extText += ext[i][0] + ' ' + ext[i][1].join(', ') + '.\n';
            }

            res.render('storyview', {
                type: 'ao3',
                title: $('title').text(),
                text: storytext,
                storytype: $('.fandom.tags > .commas > .last').text(),
                storytitle: $('#workskin > .preface.group > h2.title.heading').text().trim(),
                author: $('#workskin > .preface.group > h3.byline.heading').text(),
                description: $('#workskin > .preface.group > div.summary.module > .userstuff').text().trim(),
                extras: extText,
                chapters
            });
        }
    });
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
                        type: 'ffnet',
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
/**
 * Created by justinhamade on 2016-03-22.
 */

'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var request = require('supertest');
var expressSanitized = require('./../lib/express-sanitize-escape');

var app = express();
app.use(bodyParser.json());
app.use(expressSanitized()); // this line follows express.bodyParser()
app.post('/test', function(req, res){
    res.status(200).json(req.body);
});

describe('POST /test', function(){

    it('respond with html tags removed', function(done) {
        request(app)
            .post('/test')
            .send({hasHtml: '<script>document.write(\'cookie monster\')</script> download now'})
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function (res) {
                res.body.hasHtml = ' download now';
            })
            .end(function (err, res) {
                done(err);
            });
    });

    it('respond with html entities escaped', function(done) {
        request(app)
            .post('/test')
            .send({hasHtmlEntities: '< > \' " &'})
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function (res) {
                res.body.hasHtmlEntities = '&lt; &gt; &#39; &quot; &amp;';
            })
            .end(function (err, res) {
                done(err);
            });
    });
});

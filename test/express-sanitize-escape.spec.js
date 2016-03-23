/**
 * Created by justinhamade on 2016-03-22.
 */

'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var request = require('supertest');
var should = require('chai').should();

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
            .end(function (err, res) {
                if (err) return done(err);
                try {
                    res.body.should.have.property('hasHtml', ' download now');
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('respond with html entities escaped', function(done) {
        request(app)
            .post('/test')
            .send({hasHtmlEntities: '< > \' " &'})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                try {
                    res.body.should.have.property('hasHtmlEntities', '&lt; &gt; &#39; &quot; &amp;');
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });
    
    it('respond with arrays number and strings', function(done) {
        var testJson = {
            first: '<script>document.write(\'cookie monster\')</script> download now',
            secondObj: {
                third: '< > \' " &'
            },
            fourthArray: [
                '<pre>remove</pre> this string',
                100,
                true
            ]
        };
        
        request(app)
            .post('/test')
            .send(testJson)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                try {
                    res.body.should.have.deep.property('secondObj.third', '&lt; &gt; &#39; &quot; &amp;');
                    res.body.fourthArray[0].should.equal('&lt;pre&gt;remove&lt;/pre&gt; this string');
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });
});

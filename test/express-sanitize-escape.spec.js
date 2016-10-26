/**
 * Created by justinhamade on 2016-03-22.
 */

'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var htmlencode = require('htmlencode');
var request = require('supertest');
var sanitizer = require('sanitizer');
var should = require('chai').should();

var expressSanitized = require('./../lib/express-sanitize-escape');

describe('POST /test encoder: false sanitize: true', function () {
    encoderTest(false, true);
    // entities:  &lt; &gt; ' " &amp; ä 汉语 éöîõæœÉÖßÉéÈèÊêËëÇçÀàÂâÆæÔôŒœÙùÛûÜüŸÿ
    // hasHtml:   download now
});

describe('POST /test encoder: false sanitize: false', function () {
    encoderTest(false, false);
    // entities:  < > ' " & ä 汉语 éöîõæœÉÖßÉéÈèÊêËëÇçÀàÂâÆæÔôŒœÙùÛûÜüŸÿ
    // hasHtml:  <script>document.write('cookie monster')</script> download now
});

describe('POST /test encoder: XSSEncode sanitize: true', function () {
    encoderTest('XSSEncode', true);
    // entities:  &lt; &gt; &#39; &quot; &amp; ä 汉语 éöîõæœÉÖßÉéÈèÊêËëÇçÀàÂâÆæÔôŒœÙùÛûÜüŸÿ
    // hasHtml:   download now
});

describe('POST /test encoder: XSSEncode sanitize: false', function () {
    encoderTest('XSSEncode', false);
    // entities:  &lt; &gt; &#39; &quot; & ä 汉语 éöîõæœÉÖßÉéÈèÊêËëÇçÀàÂâÆæÔôŒœÙùÛûÜüŸÿ
    // hasHtml:  &lt;script&gt;document.write(&#39;cookie monster&#39;)&lt;/script&gt; download now
});

describe('POST /test encoder: htmlEncode sanitize: true', function () {
    encoderTest('htmlEncode', true);
    // entities:  &lt; &gt; &#39; &quot; &amp; &auml; &#27721;&#35821; &eacute;&ouml;&icirc;&otilde;&aelig;&oelig;&Eacute;&Ouml;&szlig;&Eacute;&eacute;&Egrave;&egrave;&Ecirc;&ecirc;&Euml;&euml;&Ccedil;&ccedil;&Agrave;&agrave;&Acirc;&acirc;&AElig;&aelig;&Ocirc;&ocirc;&OElig;&oelig;&Ugrave;&ugrave;&Ucirc;&ucirc;&Uuml;&uuml;&Yuml;&yuml;
    // hasHtml:   download now
});

describe('POST /test encoder: htmlEncode sanitize: false', function () {
    encoderTest('htmlEncode', false);
    // entities:  &lt; &gt; &#39; &quot; &amp; &auml; &#27721;&#35821; &eacute;&ouml;&icirc;&otilde;&aelig;&oelig;&Eacute;&Ouml;&szlig;&Eacute;&eacute;&Egrave;&egrave;&Ecirc;&ecirc;&Euml;&euml;&Ccedil;&ccedil;&Agrave;&agrave;&Acirc;&acirc;&AElig;&aelig;&Ocirc;&ocirc;&OElig;&oelig;&Ugrave;&ugrave;&Ucirc;&ucirc;&Uuml;&uuml;&Yuml;&yuml;
    // hasHtml:  &lt;script&gt;document.write(&#39;cookie monster&#39;)&lt;/script&gt; download now
});

function encoderTest(encoder, sanitize) {
    var entities = '< > \' " & ä 汉语 éöîõæœÉÖßÉéÈèÊêËëÇçÀàÂâÆæÔôŒœÙùÛûÜüŸÿ';
    var hasHtml = '<script>document.write(\'cookie monster\')</script> download now';
    var hasHtmlEncoded = hasHtml;
    var entitiesEncoded = entities;
    var app = express();

    before(function(done)
    {
        if (sanitize) {
            entitiesEncoded = sanitizer.sanitize(entitiesEncoded);
            hasHtmlEncoded = sanitizer.sanitize(hasHtmlEncoded);
        }
        if (encoder) {
            entitiesEncoded = htmlencode[encoder](entitiesEncoded);
            hasHtmlEncoded = htmlencode[encoder](hasHtmlEncoded);
        }

        app.use(bodyParser.json());
        app.use(expressSanitized.middleware({encoder: encoder, sanitize: sanitize})); // this line follows express.bodyParser()
        app.post('/test', function (req, res) {
            res.status(200).json(req.body);
        });
        done();
    });

    it('respond with html tags removed', function (done) {
        request(app)
            .post('/test')
            .send({hasHtml: hasHtml})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                try {
                    res.body.should.have.property('hasHtml', hasHtmlEncoded);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('respond with html entities escaped', function (done) {
        request(app)
            .post('/test')
            .send({hasHtmlEntities: entities})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);
                try {
                    res.body.should.have.property('hasHtmlEntities', entitiesEncoded);
                    expressSanitized.htmlDecodeBody(res.body).should.have.property('hasHtmlEntities', entities);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('respond with arrays number and strings', function (done) {
        var testJson = {
            first: hasHtml,
            secondObj: {
                third: entities
            },
            fourthArray: [
                hasHtml,
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
                    res.body.should.have.property('first', hasHtmlEncoded);
                    res.body.should.have.deep.property('secondObj.third', entitiesEncoded);
                    res.body.fourthArray[0].should.equal(hasHtmlEncoded);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });
}

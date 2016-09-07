/*!
 * express-sanitized
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('lodash');
var sanitizer = require('sanitizer');
var htmlencode = require('htmlencode');


/**
 * Simple middleware that wraps sanitzer and can be exposed
 * at the app.use router layer and apply to all methods.
 * This is best used for APIs where it is very unlikely
 * you would need to pass back and forth html entities
 *
 * @return {Function}
 * @api public
 *
 */
module.exports = function expressSanitized() {

    return function expressSanitized(req, res, next) {

        [req.body, req.query].forEach(function (val, ipar, request) {
            if (_.size(val)) {
                request[ipar] = sanitize(request[ipar])
            }
        });

        next();
    }

};

module.exports.sanitizeParams = function(router, paramNames)
{
    paramNames.forEach(function(paramName)
    {
        router.param(paramName, function(req, res, next)
        {
            req.params[paramName] = sanitize(req.params[paramName]);

            next();
        });
    });
}

function sanitize(obj) {
    if (typeof obj === 'string') {
        return htmlencode.htmlEncode(sanitizer.sanitize(obj));
    }
    if (obj instanceof Object) {
        Object.keys(obj).forEach(function(prop) {
            obj[prop] = sanitize(obj[prop]);
        });
        return obj;
    }
    return obj;
}

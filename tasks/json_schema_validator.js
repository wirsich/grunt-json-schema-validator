/*
 * grunt-json-schema-validator
 * https://github.com/wirsich/grunt-json-schema-validator
 *
 * Copyright (c) 2015 Stephan Wirsich
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('json_schema_validator', 'Grunt plugin to validate and test your "JSON-Schema" files. Supports automated tests, by testing fixtures against schemes.', function() {
    // var path = require('path');
    var options = this.options({
      cwd: '',
      isFixturesFile: function (filepath) {
        return filepath.split('/').pop() == 'fixtures.json';
      },
      isSchemaFile: function (filepath) {
        return filepath.split('/').pop() == 'schema.json';
      }
    });

    var isFixturesFile = options.isFixturesFile;
    var isSchemaFile = options.isSchemaFile;

    // var path_src = path.resolve('node_modules/grunt-json-schema-validator/src/');

    var removeCWD = function (filepath, cwd) {
      cwd = cwd || options.cwd;
      return filepath.split(cwd).join('');
    };

    var jjv = require('jjv');
    var validator_env = jjv();

    var jjve = require('jjve');
    var jjv_error_handler = jjve(validator_env);

    var renderValidationError = function (schema, data, result) {
      grunt.log.error('validation of "'+ schema.name+ '" failed.');
      var errors = jjv_error_handler(schema, data, result);


      var i = 0, l = errors.length;
      for (; i < l; ++i) {
        grunt.log.warn(errors[i].code+': '+errors[i].message);
        console.log(errors[i].data);
      }

      grunt.fail.fatal('Validation failed: fix the issues above to continue.');
    };

    var validateSchemaAgainstFixture = function (schema) {
      validator_env.addSchema(schema.name, schema.schema);
      var result = validator_env.validate(schema.name, schema.fixtures);

      if (result) {
        renderValidationError(schema.schema, schema.fixtures, result);
        return false;
      }
      return true;
    };

    var testSchema = function (schema) {
      schema = schema || {fixtures: false, schema: false};
      if (schema.schema && schema.fixtures) {
        return validateSchemaAgainstFixture(schema);
      }

      grunt.log.warn('Skip test for ', schema.schema, schema.fixtures);
    };

    var dest, schema_name;
    var schemes = {};
    this.files.forEach(function(f) {
      dest = f.dest;
      f.src.forEach(function (filepath) {
        if (grunt.file.isDir(filepath)) {
          schema_name = removeCWD(filepath);
          schemes[schema_name] = schemes[schema_name] || {};
          schemes[schema_name].name = schema_name;
        }

        if (grunt.file.isFile(filepath)) {
          if (isFixturesFile(filepath)) {
            schemes[schema_name].fixtures = grunt.file.readJSON(filepath);
          }
          if (isSchemaFile(filepath)) {
            schemes[schema_name].schema = grunt.file.readJSON(filepath);
          }
        }
      });
    });

    // iterate schemes
    for (var schema in schemes) {
      testSchema(schemes[schema])
    }

    grunt.log.ok('validation done.');
    // @TODO coverage report
  });
};

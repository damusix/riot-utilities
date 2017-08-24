'use strict';

module.exports = function(config) {

    config.set({

        basePath: '',

        frameworks: [

            'mocha',
            'chai'
        ],

        plugins: [

            'karma-mocha',
            'karma-mocha-reporter',
            'karma-firefox-launcher',
            'karma-chai'
        ],

        files: [

            'node_modules/riot/riot.js',
            'dist/riot-utilities.umd.js',
            'test/**/*.js'
        ],

        riotPreprocessor: {

            options: {

                type: 'es6'
            }
        },

        browsers: ['Firefox'],
        reporters: ['mocha'],
        failOnEmptyTestSuite: false,
        autoWatch: true
    });

};

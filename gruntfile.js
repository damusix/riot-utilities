'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-riot');

    // Isolate tasks
    const js = ['riot', 'browserify'];
    const watch = js.concat('watch');

    grunt.registerTask('build', js);
    grunt.registerTask('default', watch);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        riot: {
            options: {
                concat: true
            },
            dev: {
                src: 'lib/**/*.tag',
                dest: 'tags.js'
            }
        },

        browserify: {
            development: {
                src: [
                    // 'tags.js',
                    'index.js'
                ],
                dest: './dist/riot-utils.js',
                options: {
                    browserifyOptions: { debug: true },
                    transform: [
                        ['babelify', { presets:['es2015'] }]
                    ]
                }
            }
        },

        watch: {
            riot: {
                files: ['lib/**/*.tag', 'lib/**/*.js', 'index.js'],
                tasks: js,
                options: {

                    livereload: true
                }
            }
        }

    });

};

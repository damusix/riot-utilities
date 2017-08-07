'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-riot');

    // Isolate tasks
    const js = ['riot'];
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

        watch: {
            riot: {
                files: ['client/**/*.tag'],
                tasks: js,
                options: {

                    livereload: true
                }
            }
        }

    });

};

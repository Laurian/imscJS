module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        properties: grunt.file.readJSON('properties.json'),
        pkg: grunt.file.readJSON('package.json'),
        clean: ['<%= properties.webappBuildDir %>'],
        copy: [
            // copy tests
            {expand: true, cwd: '<%= properties.webappTestDir %>', src: '**', dest: '<%= properties.webappBuildDir %>'},

            // copy tests resources
            {expand: true, cwd: '<%= properties.unitTestsResourcesDir %>', src: '**', dest: '<%= properties.webappBuildDir %>'}
        ],
        npmcopy: {
            default: {
                files: {
                    '<%= properties.webappBuildDir %>/libs/': [
                        'sax:main',
                        'qunit-assert-close:main',
                        'qunitjs:main'
                    ]
                }
            }
        },
        browserify: {
            default: {
                src: "./src/main/js/main.js",
                dest: "<%= properties.webappBuildDir %>/libs/imsc.js",
                options: {
                    exclude: ["sax"],
                    browserifyOptions: {
                        standalone: 'imsc'
                    }
                }
            }
        },
        jshint: {
            default: {
                src: "src/main/js",
                options: {
                    "-W032": true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-npmcopy');

    grunt.loadNpmTasks('grunt-browserify');
    
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('build', ['jshint', 'clean', 'copy', 'npmcopy', 'browserify']);

};
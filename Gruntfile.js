var fs = require('fs');
var swig = require('swig');

module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    grunt.initConfig({

        visuals: {
            jspmFlags: '-m'
        },

        watch: {
            js: {
                files: ['src/js/**/*.js', 'src/js/**/*.html', 'src/js/**/*.json'],
                tasks: ['shell:interactive'],
            },
            bootjs: {
                files: ['src/js/boot.js.tpl'],
                tasks: ['generateBootFiles'],
            },
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass:interactive'],
            },
            assets: {
                files: ['src/assets/**/*'],
                tasks: ['copy:assets'],
            },
            harness: {
                files: ['harness/**/*'],
                tasks: ['harness']
            }
        },

        shell: {
            interactive: {
                command: './node_modules/.bin/jspm bundle-sfx <%= visuals.jspmFlags %> src/js/main build/main.js --format amd',
                options: {
                    execOptions: {
                        cwd: '.'
                    }
                }
            }
        },

        clean: {
            build: ['build']
        },

        sass: {
            options: {
                sourceMap: true
            },
            interactive: {
                files: {
                    'build/main.css': 'src/css/main.scss',
                    'build/snap.css': 'src/css/snap.scss'
                }
            },
            harness: {
                files: {
                    'build/fonts.css': 'harness/fonts.scss'
                }
            }
        },

        'template': {
            'options': {
                'data': {
                    'assetPath': '<%= visuals.assetPath %>',
                }
            },
            'harness': {
                'files': {
                    'build/interactive.html': ['harness/interactive.html.tpl'],
                    'build/immersive.html': ['harness/immersive.html.tpl']
                }
            }
        },

        copy: {
            harness: {
                files: [
                    {expand: true, cwd: 'harness/', src: ['curl.js', 'index.html', 'subject.html', 'mega.json', 'front.html'], dest: 'build'},
                ]
            },
            assets: {
                files: [
                    {expand: true, cwd: 'src/', src: ['assets/**/*'], dest: 'build'},
                ]
            },
            system: {
                files: [
                    {expand: true, cwd: 'jspm_packages/', src:
                        ['es6-module-loader.js',
                         'system.js'], dest: 'build' },
                    {expand: true, cwd: 'jspm_packages/github/jmcriffey/bower-traceur-runtime@0.0.88', src:
                        ['traceur-runtime.js'], dest: 'build' }
                ]
            },
            deploy: {
                files: [
                    { // BOOT
                        expand: true, cwd: 'build/',
                        src: ['bootfiles/**/*'],
                        dest: 'deploy/<%= visuals.timestamp %>'
                    },
                    { // ASSETS
                        expand: true, cwd: 'build/',
                        src: ['main.js', 'main.css', 'main.js.map', 'main.css.map', 'assets/**/*',
                              'es6-module-loader.js', 'traceur-runtime.js', 'system.js'],
                        dest: 'deploy/<%= visuals.timestamp %>/<%= visuals.timestamp %>'
                    }
                ]
            }
        },

        symlink: {
            options: {
                overwrite: false
            },
            fonts: {
                src: 'bower_components/guss-webfonts/webfonts',
                dest: 'build/fonts/0.1.0'
            },
        },

        prompt: {
            visuals: {
                options: {
                    questions: [
                        {
                            config: 'visuals.s3.stage',
                            type: 'list',
                            message: 'Deploy to TEST or PRODUCTION URL?',
                            choices: [{
                                name: 'TEST: <%= visuals.s3.domain %>testing/<%= visuals.s3.path %>',
                                value: 'TEST'
                            },{
                                name: 'PROD: <%= visuals.s3.domain %><%= visuals.s3.path %>',
                                value: 'PROD'
                            }]
                        },
                        {
                            config: 'visuals.confirmDeploy',
                            type: 'confirm',
                            message: 'Deploying to PRODUCTION. Are you sure?',
                            default: false,
                            when: function(answers) {
                                return answers['visuals.s3.stage'] === 'PROD';
                            }
                        }
                    ],
                    then: function(answers) {
                        if (grunt.config('visuals.s3.stage') !== 'PROD') { // first Q
                            var prodPath = grunt.config('visuals.s3.path');
                            var testPath = 'testing/' + prodPath;
                            grunt.config('visuals.s3.path', testPath);
                        } else if (answers['visuals.confirmDeploy'] !== true) { // second Q
                            grunt.fail.warn('Please confirm to deploy to production.');
                        }
                    }
                }
            },
        },

        aws_s3: {
            options: {
                accessKeyId: '<%= visuals.aws.AWSAccessKeyID %>',
                secretAccessKey: '<%= visuals.aws.AWSSecretKey %>',
                region: 'us-east-1',
                debug: grunt.option('dry'),
                bucket: '<%= visuals.s3.bucket %>',
                uploadConcurrency: 10
            },
            production: {
                options: {
                },
                files: [
                    { // ASSETS
                        expand: true,
                        cwd: 'deploy/<%= visuals.timestamp %>',
                        src: ['<%= visuals.timestamp %>/**/*'],
                        dest: '<%= visuals.s3.path %>',
                        params: { CacheControl: 'max-age=2678400' }
                    },
                    { // BOOT
                        expand: true,
                        cwd: 'deploy/<%= visuals.timestamp %>',
                        src: ['bootfiles/**/*'],
                        dest: '<%= visuals.s3.path %>',
                        params: { CacheControl: 'max-age=60' }
                    }]
            }
        },

        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 8000,
                    base: 'build',
                    middleware: function (connect, options, middlewares) {
                        // inject a custom middleware http://stackoverflow.com/a/24508523
                        middlewares.unshift(function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            return next();
                        });
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.registerTask('loadDeployConfig', function() {
        if (!grunt.file.exists('cfg/aws-keys.json')) grunt.fail.fatal('./cfg/aws-keys.json missing');
        grunt.config('visuals', {
            s3: grunt.file.readJSON('./cfg/s3.json'),
            aws: grunt.file.readJSON('./cfg/aws-keys.json'),
            timestamp: Date.now(),
            jspmFlags: '-m',
            assetPath: '<%= visuals.s3.domain %><%= visuals.s3.path %>/<%= visuals.timestamp %>'
        });
    })

    grunt.registerTask('boot_url', function() {
        grunt.log.write('\nBOOT URL: '['green'].bold)
        grunt.log.writeln(grunt.template.process('<%= visuals.s3.domain %><%= visuals.s3.path %>/boot.js'))
    })

    grunt.registerTask('generateBootFiles', function() {
        var subjectPages = JSON.parse(fs.readFileSync('./data/subjectPages.json'));
        var bootTemplateFn = swig.compileFile('./src/js/boot.js.tpl');
        var assetPath = grunt.config('visuals.assetPath');
        subjectPages.forEach(function(page) {
            page.assetPath = assetPath;
            var bootBody = bootTemplateFn(page);
            var outPath = './build/bootfiles/' + (page.subjectId || 'main') + '/boot.js';
            grunt.file.write(outPath, bootBody);
        });
    })

    grunt.registerTask('bootjsurls', function() {
        var subjects = JSON.parse(fs.readFileSync('./data/guardianSubjectGroups.json'));
        var baseUrl = grunt.template.process('<%= visuals.s3.domain %><%= visuals.s3.path %>/bootfiles/');
        var bootUrls = subjects.map(function(p) { return p.guardianSubjectGroup + '\n' + baseUrl + p.gsgId + '/boot.js'; })
        grunt.file.write('./build/booturls.txt', bootUrls.join('\n\n'));
    })

    grunt.registerTask('harness', ['copy:harness', 'template:harness', 'sass:harness', 'symlink:fonts'])
    grunt.registerTask('interactive', ['shell:interactive', 'generateBootFiles', 'sass:interactive', 'copy:assets', 'copy:system'])
    grunt.registerTask('default', ['clean', 'harness', 'interactive', 'connect', 'watch']);
    grunt.registerTask('build', ['clean', 'interactive']);
    grunt.registerTask('deploy', ['loadDeployConfig', 'prompt:visuals', 'build', 'copy:deploy', 'aws_s3', 'bootjsurls']);

    grunt.loadNpmTasks('grunt-aws');

}

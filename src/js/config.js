System.config({
  "baseURL": "/",
  "transpiler": "traceur",
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  },
  "bundles": {
    "build/main": [
      "src/js/main"
    ]
  }
});

System.config({
  "map": {
    "fat/bean": "github:fat/bean@1.0.14",
    "guardian/iframe-messenger": "github:guardian/iframe-messenger@master",
    "json": "github:systemjs/plugin-json@0.1.0",
    "olado/doT": "github:olado/doT@1.0.1/doT.min",
    "reqwest": "github:ded/reqwest@1.1.5",
    "text": "github:systemjs/plugin-text@0.0.2",
    "traceur": "github:jmcriffey/bower-traceur@0.0.88",
    "traceur-runtime": "github:jmcriffey/bower-traceur-runtime@0.0.88"
  }
});


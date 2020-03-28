# Description
A loader for webpack, using AST to add exception report(like sentry) in try-catch block


# Installation
```javascript
npm install catch-add-report-loader --save-dev
```

# Usage
## In vue-cli
```javascript
chainWebpack: config => {
    const vueRule = config.module.rule('vue');
    const jsRule = config.module.rule('js');

    jsRule.use('js')
        .loader('catch-add-report-loader')
        // you can custom reportCode here, like
        .options({
            reportCode: (param, path) => `window && window.Sentry && window.Sentry.captureException(${param});

            function abc() {
                // e: from runtime catch param
                console.log('e', e);
            }

            abc();
            console.log('hello-world');`
        });
},
```

## In basic webpack config
```javascript
module: {
    rules: [{
        test: /\.js$/,
        loaders: [{
            loader: 'babel-loader'
        }, {
            // place this loader first
            loader: 'catch-add-report-loader',
            options: {}
        }],
    }, {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            scss: ['css-hot-loader'].concat(ExtractTextPlugin.extract({
              use: sassOptions,
              fallback: styleLoaderOptions
            })),
            ...
            // add js loader here
            js: 'catch-add-report-loader'
          }
        }
      },]
}
```

## Disable injecting
Setting comment `/* add-report: false */` after the `parameter`
```javascript
try {
    abc();
} catch (e /* add-report: false */) {
    console.log(e);
}
```

# Options

## reportCode
`type: string | function(param, path) {return [string]}

This string code will be injected at the begining of the try-catch block.

1. Default is `window.Sentry && window.Sentry.captureException(${param});`

`param` is the catch block 'parameter`.
```javascript
// before
try {
    abc();
} catch (error) {
    console.log(error);
}

// after
try {
    abc();
} catch (error) {
    window.Sentry && window.Sentry.captureException(error);
    console.log(e);
}
```

2. Custom a string
```javascript
.options({
    reportCode: 'myCustomReport();'
})
```

3. Custom a function, two parameters can be used, and multiple code lines are allowed here
- 3-1 `param` is the catch block 'parameter`
- 3-2 `path` is the AST CatchClause object, see https://astexplorer.net/

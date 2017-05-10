# ng2-fused
[FuseBox](http://fuse-box.org/) plugins and utilities for building Angular2 applications.

## Installation

```bash
npm install ng2-fused --save-dev
```

[![NPM](https://nodei.co/npm/ng2-fused.png?downloads=true)](https://nodei.co/npm/ng2-fused/)

## Ng2TemplatePlugin

Wraps url strings for templateUrl and styleUrls inside of require statements.  Inspired by [angular2-template-loader](https://github.com/TheLarkInn/angular2-template-loader) for webpack.

### Usage

Just call the `Ng2TemplatePlugin()` within the FuseBox plugins array.

You should also use the RawPlugin so that the imported stylesheet gets exported as a text string.

```javascript
const { FuseBox } = require('fuse-box');
const { Ng2TemplatePlugin } = require('ng2-fused');

const fuse = FuseBox.init({
    homeDir: './src',
    plugins: [
        Ng2TemplatePlugin(),
        ['*.component.html', RawPlugin()],
        ['*.component.css', RawPlugin()]
     //   or with a css pre/post processor...
     // ['*.component.css', PostCss([precss()]), RawPlugin()]   
    ]
});

fuse.devServer('> main.ts');
```


### Before Transform...

```typescript
@Component({
    selector: 'my-component',
    templateUrl: './my.component.html',
    styleUrls: ['./my.component.css']
})
export class MyComponent {}
```

### After Transform...

```typescript
@Component({
    selector: 'my-component',
    template: require('./my.component.html'),
    styles: [require('./my.component.css')]
})
export class MyComponent {}
```

### Options

You can tweak the plugin with the following options:

<dl>
    <dt>ignoreStyleUrls</dt>
    <dd>If true, will not convert the urls found within the styleUrls property.</dd>
    <dt>ignoreTemplateUrl</dt>
    <dd>If true, will not convert the url found within the templateUrl property.</dd>
    <dt>templateUrlPattern</dt>
    <dd>A RegExp object in case you need a custom pattern to match template urls.</dd>
    <dt>styleUrlsPattern</dt>
    <dd>A RegExp object in case you need a custom pattern to match style urls.</dd>
    <dt>urlStringPattern</dt>
    <dd>A RegExp object in case you need a custom pattern to match url strings.</dd>
</dl>

```typescript
plugins: [
    Ng2TemplatePlugin({ ignoreStyleUrls: true })
]
```

## Ng2RouterPlugin

Converts Angular2 lazy loaded routes within loadChildren properties to a Promise that calls FuseBox's lazy import of a module. Inspired by [angular2-router-loader](https://github.com/brandonroberts/angular-router-loader) for webpack.

### Usage

The plugin should be configured with the `publicPath` option, which will be prepended to the module's name.

```javascript
const { FuseBox } = require('fuse-box');
const { Ng2RouterPlugin } = require('ng2-fused');

const fuse = FuseBox.init({
    homeDir: './src',
    plugins: [
        Ng2RouterPlugin({
            publicPath: '/assets/js'
        }),
    ]
});

fuse.devServer('> main.ts');
```


### Before Transform...

```typescript
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'lazy', loadChildren: '~/app/lazy/lazy.module#LazyModule' }
];
```

### After Transform...

```typescript
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'lazy', loadChildren: () => new Promise(function (resolve, reject) {
            FuseBox.exists('~/app/lazy/lazy.module') ? resolve(require('~/app/lazy/lazy.module')['LazyModule']) : 
                FuseBox.import('/assets/js/bundle-lazy.module.js', (loaded) => loaded ? 
                    resolve(require('~/app/lazy/lazy.module')['LazyModule']) :
                    reject('Unable to load module \'LazyModule\' from \'/assets/js/bundle-lazy.module.js\'.')) 
                })
        }) 
    }
];
```

### Options

You can tweak the plugin with the following options:

<dl>
    <dt>bundleName</dt>
    <dd>Optional fn, if set the generated bundle name is created from this. Other bundle naming properties (bundlePrefix, bundleSuffix, etc) are ignored..</dd>
    <dt>bundlePrefix</dt>
    <dd>Prefix to add to the generated bundle filename.  Defaults to 'bundle-'.</dd>
    <dt>bundleSuffix</dt>
    <dd>Suffix to add to the generated bundle filename.  Defaults to ''. </dd>
    <dt>loadChildrenPattern</dt>
    <dd>The regex pattern used to find the loadChildren string.</dd>
    <dt>publicPath</dt>
    <dd>The public url folder path that the generated bundles should be generated from.</dd>
</dl>

### Issues...

Currently the loadChildren property must be used with `~` root indicator, relative paths with '.' will not work.

## Roadmap

* Auto bundle creation of lazy loaded routes found by Ng2RouterPlugin

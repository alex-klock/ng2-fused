# ng2-fused
[FuseBox](http://fuse-box.org/) plugins and utilities for building Angular2 applications. Templating, Lazy Loaded Modules, and Spec Bundle support.

## Installation

```bash
npm install ng2-fused --save-dev
```

[![NPM](https://nodei.co/npm/ng2-fused.png?downloads=true)](https://nodei.co/npm/ng2-fused/)

Check out the [ng2-fused-seed](https://github.com/alex-klock/ng2-fused-seed) project for a working starter project utilizing the following plugins.

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

...

fuse.run();
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

** O.5 Breaking Changes ** - Version 0.5 changed the behaviour of this plugin to better work for both JIT and AOT builds.

Converts Angular2 lazy loaded routes within loadChildren properties utilize a custom NgModuleFactoryLoader that works with FuseBox bundles (even ones bundled with the Quantum plugin).  Also has a utility that will automatically configure FuseBox to automatically code split modules based on folder naming conventions (module folders beginning with "+"). Inspired by [angular2-router-loader](https://github.com/brandonroberts/angular-router-loader) for webpack.

### Usage

The plugin should be configured as a top level plugin.

```javascript
const { FuseBox } = require('fuse-box');
const { Ng2RouterPlugin } = require('ng2-fused');

const fuse = FuseBox.init({
    homeDir: './src',
    plugins: [
        Ng2RouterPlugin({ 
            aot: config.aot,
            autoSplitBundle: 'app',
            vendorBundle: 'vendors'
        })      
    ]
});

...

fuse.run();
```

### Options

You can tweak the plugin with the following options:

<dl>
    <dt>aot</dt>
    <dd>Optional flag letting the plugin know whether or not this is an AOT build. Utilized to automatically handle module imports to look for .ngfactory extensions.</dd>
    <dt>aotAppPath</dt>
    <dd>The root app folder when building in aot build. Defaults to 'aot/app'.</dd>
    <dt>appPath</dt>
    <dd>The root app path folder. Defaults to 'app'. </dd>
    <dt>autoSplitBundle</dt>
    <dd>The name of the bundle to perform auto splitting on.  If not set, auto splitting will be disabled.</dd>
</dl>

### Issues...

Currently the switching between AOT and JIT sometimes causes issues when FuxeBox's cache is used.  As a workaround, when a build is executed, the cache folder is first deleted.

## Ng2SpecBundlePlugin

This plugin allows for the creation of a spec bundle file that imports all spec files found in the project.  This is more so required if using the QuantumPlugin.  It should be used as a plugin for ONLY the bundle that the specs should be provided in.

```
fuse.bundle('app')
    .plugin(Ng2SpecBundlePlugin())
    ...
```

By default this plugin tests for the file `/spec-bundle\.(ts|js)$/`, if you wish for your spec bundle file to be named something different then you'll have to change this.

### Options

<dl>
    <dt>cwd</dt>
    <dd>The path search for specs in, used for glob searching for spec files. Defaults to `"build/workspace"`.<dd>
    <dt>specPathPrefix<dt>
    <dd>Defaults to '../', used as a prefix to the spec file paths.<dd>
    <dt>specPattern<dt>
    <dd>Glob pattern for finding specs. Defaults to `"**/*.spec.ts"`</dd>
</dl>

## Roadmap

* Auto import of html and css for components if files are found in folder structure.
* More unit tests.
* More samples.

For a seed project utilizing FuseBox and Ng2Fused, check out https://github.com/alex-klock/ng2-fused-seed.
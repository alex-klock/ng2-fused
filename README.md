# ng2-fused
[FuseBox](http://fuse-box.org/) plugins and utilities for building Angular2 applications.

## Installation

```bash
npm install ng2-fused --save-dev
```

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
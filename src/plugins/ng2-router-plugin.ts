import * as path from 'path';

/**
 * Plugin that replaces a loadChildren string within Angular2 routes with a lazy load fuse-box promise.
 * 
 * @export
 * @class Ng2LazyPlugin
 */
export class Ng2RouterPluginClass {

    /**
     * List of modules that have been added via this plugin.
     * 
     * @static
     * @type {{ [moduleName: string]: LazyModuleInfo }}
     */
    public static lazyModules: { [moduleName: string]: LazyModuleInfo } = {};

    /**
     * The FuseBox WorkflowContext.
     * 
     * @type {WorkflowContext}
     */
    public context: any;

    /**
     * Reference to the global list of modules that have been loaded lazily.
     * 
     * @readonly
     * @type {{ [moduleName: string]: LazyModuleInfo }}
     */
    public get lazyModules(): { [moduleName: string]: LazyModuleInfo } {
        return Ng2RouterPluginClass.lazyModules;
    }

    /**
     * Gets the regex pattern used to find the loadChildren string.
     * 
     * @readonly
     * @type {RegExp}
     */
    public get loadChildrenPattern(): RegExp {
        return this.options.loadChildrenPattern;
    }

    /**
     * Options for the plugin.
     * 
     * @type {Ng2LazyPluginOptions}
     */
    public options: Ng2RouterPluginOptions;

    public test: RegExp|string = '*.ts$|*.js$';

    /**
     * Creates an instance of Ng2LazyPluginClass.
     * @param {Ng2LazyPluginOptions} [options] 
     */
    constructor(options?: Ng2RouterPluginOptions) {
        this.options = Object.assign({
            bundlePrefix: 'bundle-',
            bundleSuffix: '',
            loadChildrenPattern: /loadChildren[\s]*:[\s]*['|"](.*?)['|"]/gm
        }, options);
        if (options && options.test) {
            this.test = options.test;
        }
    }

    public init(context) {
        this.context = context;
    }
/*
    public onTypescriptTransform(file) {
        // file.contents = this.transformSource(file.contents);
    }
    */

    /**
     * Implements FuseBox Plugin's onTypescriptTransform's method.  
     * 
     * @param {any} file 
     * @returns 
     */
    public transform(file) {      
        file.contents = this.transformSource(file.contents);
    }

    /**
     * Parses the loadChildren string for module information.
     * 
     * @param {string} loadChildren 
     * @returns 
     */
    public parseLoadChildrenValue(loadChildren: string): LazyModuleInfo {
        let split = loadChildren.split('#');
        if (split.length < 2) {
            return null;
        }
        let moduleSplit = split[1].split('?');
        let importPath = split[0];
        let moduleName = moduleSplit[0];
        let query;
        if (moduleSplit.length > 1) {
            let querySplit = moduleSplit[1].split('&');
            query = {};
            for (let i = 0; i < querySplit.length; i += 2) {
                query[querySplit[i]] = querySplit[i + 1];
            }
        }
        let moduleFileName = path.basename(importPath);
        let outFolder: string;

        if (this.context && this.context.outFile) {
            if (this.options.publicPath) {
                outFolder = this.options.publicPath;
            } else {
                outFolder = path.dirname(this.context.outFile.replace(process.cwd(), ''));
            }
        }

        let moduleInfo: LazyModuleInfo = {
            importPath, moduleName, query
        };
        
        if (this.options.bundleName) {
            if (typeof this.options.bundleName === 'function') {
                moduleInfo.loadPath = outFolder + '/' + this.options.bundleName(moduleInfo);
            } else {
                throw new Error(`Ng2RouterPlugin option 'bundleName' expected function but got '${typeof this.options.bundleName}' instead.`);
            }
        } else {
            moduleInfo.loadPath = `${outFolder}/${this.options.bundlePrefix}${moduleFileName}${this.options.bundleSuffix}.js`;
        }

        return moduleInfo;
    }

    /**
     * Transforms the source code by replacing the loadChildren strings with lazy loaded promises.
     * 
     * @param {string} source 
     * @returns {string} 
     */
    public transformSource(source: string): string {
        source = source.replace(this.loadChildrenPattern, (match, loadChildren: string) => {
            let moduleInfo = this.parseLoadChildrenValue(loadChildren);
            if (!moduleInfo) {
                return loadChildren;
            }
            this.lazyModules[moduleInfo.moduleName] = moduleInfo;
            return this._insertLazyImport(moduleInfo);
        });
        return source;
    }

    private _insertLazyImport(moduleInfo: LazyModuleInfo) {

        return 'loadChildren: function () { return new Promise(function (resolve, reject) {' +
            `FuseBox.exists('${moduleInfo.importPath}') ? resolve(require('${moduleInfo.importPath}')['${moduleInfo.moduleName}']) : ` +
            `FuseBox.import('${moduleInfo.loadPath}', (loaded) => loaded ? ` +
            `resolve(require('${moduleInfo.importPath}')['${moduleInfo.moduleName}']) : ` + 
            `reject("Unable to load module '${moduleInfo.moduleName}' from '${moduleInfo.loadPath}'.")) }) }`;
    }
}

/**
 * Creates a new instance of the Ng2RouterPlugin.
 * 
 * @export
 * @returns 
 */
export function Ng2RouterPlugin(options?: Ng2RouterPluginOptions) {
    return new Ng2RouterPluginClass(options);
}

/**
 * Options that can be passed into the Ng2LazyPlugin.
 * 
 * @export
 * @interface Ng2LazyPluginOptions
 */
export interface Ng2RouterPluginOptions {
    
    /**
     * Optional fn, if set the generated bundle name is created from this. Other bundle naming properties (bundlePrefix, bundleSuffix, etc)
     * are ignored.
     */
    bundleName?: ((info: LazyModuleInfo) => string);

    /**
     * Prefix to add to the generated bundle filename.  Defaults to 'bundle-'.
     * 
     * @type {string}
     */
    bundlePrefix?: string;

    /**
     * Suffix to add to the generated bundle filename.  Defaults to ''. 
     * 
     * @type {string}
     */
    bundleSuffix?: string;

    /**
     * The regex pattern used to find the loadChildren string.
     * 
     * @type {RegExp}
     */
    loadChildrenPattern?: RegExp;

    /**
     * The public url folder path that the generated bundles should be generated from.
     * 
     * @type {string}
     * @example
     * If your FuseBox outputFile is /build/js/outFile.js, then the default generated bundles will be created in 
     * /build/js/.  If the url to reach this folder should be /js/bundle-some.module.js, then you'll want
     * to set the public path to '/js'.  This will cause the generated lazy load code to do a http request
     * to '/js/bundoe-some.module.js'.
     */
    publicPath?: string;


    /**
     * The test property for FuseBox plugins. Can be a regular expression or a string for a simplified regexp.
     * Defaults to '*.ts$|*.js$'.
     * 
     * @type {(RegExp|string)}
     */
    test?: RegExp|string;
}

/**
 * Information about a module based on its loadChildren string.
 * 
 * @export
 * @interface LazyModuleInfo
 */
export interface LazyModuleInfo {
    /**
     * The import path to the module file itself.
     * 
     * @type {string}
     */
    importPath: string;
    /**
     * The path to the bundled module file to load when requested lazily.
     * 
     * @type {string}
     */
    loadPath?: string;
    /**
     * The name of the module.
     * 
     * @type {string}
     */
    moduleName: string;
    /**
     * Any query parameters 
     * 
     * @type {{ [key: string]: any }}
     */
    query?: { [key: string]: any }
}
import { Plugin, WorkFlowContext } from 'fuse-box';
import * as fs from 'fs';
import * as path from 'path';
import * as escodegen from 'escodegen';
import { NgContext } from '../../analysis/core/ng-context';

/**
 * Plugin that replaces a loadChildren string within Angular2 routes with a lazy load fuse-box promise.
 * 
 * @export
 * @class Ng2LazyPlugin
 */
export class Ng2RouterPluginClass implements Plugin {

    public dependencies: string[];

    public ngModuleLoaderPath = 'ng2-fused/modules/ng-fused-module-loader.ts';

    public ngModuleLoaderName = 'NgFusedModuleLoader';

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

    public test: RegExp = /\.module\.(ngfactory\.)?(ts|js)$/

    /**
     * Creates an instance of Ng2LazyPluginClass.
     * @param {Ng2LazyPluginOptions} [options] 
     */
    constructor(options?: Ng2RouterPluginOptions) {
        this.options = Object.assign({
            appPath: 'app',
            aotAppPath: 'aot/app',
            autoSplitBundle: 'app',
            loadChildrenPattern: /loadChildren[\s]*:[\s]*['|"](.*?)['|"]/gm,
            vendorBundle: 'vendors'
        }, options);
        if (options && options.test) {
            this.test = <any> options.test;
        }
    }

    public init(context) {
        this.context = context;
        if (!this.options.vendorBundle || this.options.vendorBundle === context.bundle.name) {
            // should we attempt to auto inject ng-fused-module-loader?
        }
    }

    public preBundle(context: WorkFlowContext) {
        
        if (this.options.autoSplitBundle !== context.bundle.name) {
            return;
        }

        let fusePath = this.options.aot ? this.options.aotAppPath : this.options.appPath;
        let modulesRoot = path.join(context.homeDir, fusePath);
        
        let files = fs.readdirSync(modulesRoot);
        for (let file of files) {
            let featurePath = path.join(modulesRoot, file);
            let stat = fs.statSync(featurePath);
            if (stat.isDirectory() && file.indexOf('+') === 0) {
                let featureName = file.substring(1);
                let featureFiles = fs.readdirSync(featurePath);
                let entryFile = featureFiles.find(f => {                   
                    return f.indexOf(featureName + '.module.') !== -1 &&
                        f.indexOf('.spec.') === -1;
                });
                if (!entryFile) {
                    entryFile = featureFiles.find(f => {
                        return f.indexOf('.module.') !== -1 &&
                            f.indexOf('-routing.') === -1 &&
                            f.indexOf('.spec.') === -1;
                    });
                }
                if (!entryFile) {
                    entryFile = featureFiles.indexOf('index.ts') !== -1 ? 'index.ts' : null;
                }

                if (entryFile) {
                    let entryPath = path.posix.join(fusePath, file, entryFile);

                    context.bundle.split(`**/${file}/**`, `${featureName} > ${entryPath}`);
                } else {
                    console.warn(`Unable to find entry file for feature folder at '${featurePath}. No split bundle added.`);
                }
            }
        }
    }

    /**
     * Implements FuseBox Plugin's onTypescriptTransform's method.  
     * 
     * @param {any} file 
     * @returns 
     */
    public transform(file) {
        
        if (this.options.vendorBundle === file.context.bundle.name) {
            return;
        }

        let ngContext = new NgContext(file);
        let containsRoutes: boolean;
        file.contents = file.contents.replace(this.loadChildrenPattern, (match, loadChildren: string) => {
            try {
                let moduleInfo = this.parseLoadChildrenValue(loadChildren, file);
                if (!moduleInfo) {
                    return match;
                }
                //return match;
                containsRoutes = true;
                return this._insertLazyImport(moduleInfo);
            } catch (ex) {
                console.error("ERROR:", ex);
                return match;
            }
        });
        file.contents = file.contents.replace(/[a-z0-9]+\.(?!SystemJsNgModuleLoaderConfig)SystemJsNgModuleLoader/g, match => {
            containsRoutes = true;
            return this.ngModuleLoaderName;
        });
        if (containsRoutes) {
            
            ngContext.analyze();

            if (ngContext.ngItems.modules) {
                let ngModule = ngContext.ngItems.modules[0];
                if (ngModule) {
                    let providers = ngModule.metadata.providers;
                    if (!providers) {
                        providers = ngModule.addMetadataProperty('providers', []);
                    } 
                    
                    providers.addValue({
                        type: 'ObjectExpression',
                        properties: [{
                            type: 'Property',
                            key: { type: 'Identifier', name: 'provide' },
                            value: { type: 'Identifier', name: 'NgModuleFactoryLoader' },
                            kind: 'init'
                        }, {
                            type: 'Property',
                            key: { type: 'Identifier', name: 'useClass' },
                            value: { type: 'Identifier', name: this.ngModuleLoaderName },
                            kind: 'init' 
                        }]});
                    
                    file.contents = `var ${this.ngModuleLoaderName} = require("${this.ngModuleLoaderPath}").${this.ngModuleLoaderName};
                    var NgModuleFactoryLoader = require("@angular/core").NgModuleFactoryLoader;
                    ` + escodegen.generate(file.analysis.ast);
                    return;
                }
                
            }
            file.contents = `var ${this.ngModuleLoaderName} = require("${this.ngModuleLoaderPath}").${this.ngModuleLoaderName};
            ` + file.contents;
        }
    }

    public getBundleFile(fusePath: string, file): LazyModuleInfo {
        if (file.context.experimentalFeaturesEnabled) {
            let splitConfig = file.context.bundle.producer.fuse.context.quantumSplitConfig.resolveOptions;
            let bundles = splitConfig['bundles'];
            for (let bundleName in bundles) {
                if (bundles.hasOwnProperty(bundleName)) {
                    let bundle = bundles[bundleName];

                    if (bundle.main.indexOf(fusePath) !== -1) {
                        return {
                            browserPath: path.join(splitConfig.browser, splitConfig.dest, bundleName + '.js').replace(/\\/g, '/'),
                            bundleName: file.context.bundle.name,
                            fusePath: bundle.main.slice(0, -3),
                            splitBundleName: bundleName
                        };
                    }
                    
                }
            }
        } else {
            let splitConfig = file.context.bundle.bundleSplit;
            if (splitConfig) {
                let moduleInfo = null;
                splitConfig.bundles.forEach((bundle, bundleName) => {
                    if (bundle.main.indexOf(fusePath) !== -1) {
                        moduleInfo = {
                            browserPath: path.join(splitConfig.browserPath, splitConfig.dest, bundleName + '.js').replace(/\\/g, '/'),
                            bundleName: file.context.bundle.name,
                            fusePath: bundle.main.slice(0, -3),
                            splitBundleName: bundleName
                        };
                    }
                });
                return moduleInfo;
            }
        }
        return null;
    }

    /**
     * Parses the loadChildren string for module information.
     * 
     * @param {string} loadChildren 
     * @returns 
     */
    public parseLoadChildrenValue(loadChildren: string, file): LazyModuleInfo {
        let split = loadChildren.split('#');
        if (split.length < 2) {
            return null;
        }

        let fusePath = split[0];
        let moduleName = split[1];

        let moduleInfo: LazyModuleInfo = this.getBundleFile(fusePath, file);
        if (!moduleInfo) {
            return null;
        }

        moduleInfo.moduleName = this.options.aot ? moduleName + 'NgFactory' : moduleName;
        moduleInfo.packageName = file.context.defaultPackageName;
        return moduleInfo;
    }

    private _insertLazyImport(moduleInfo: LazyModuleInfo) {
        return `loadChildren: '${moduleInfo.fusePath}#${moduleInfo.moduleName}?url=${moduleInfo.browserPath}&split=${moduleInfo.splitBundleName}&pkg=${moduleInfo.packageName}'`;
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
     * Whether or not the angular is building in aot mode.
     */
    aot?: boolean;

    /**
     * The root app folder when building in aot build. Defaults to 'aot/app'.
     */
    aotAppPath?: string;

    /**
     * The root app path folder. Defaults to 'app'.
     */
    appPath?: string;

    /**
     * Whether or not to automatically configure the bundle to split based on file structure.
     */
    autoSplitBundle?: string;

    vendorBundle?: string;

    /**
     * The regex pattern used to find the loadChildren string.
     * 
     * @type {RegExp}
     */
    loadChildrenPattern?: RegExp;

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
    fusePath?: string;
    /**
     * The path to the bundled module file to load when requested lazily.
     * 
     * @type {string}
     */
    browserPath?: string;

    bundleName?: string;

    packageName?: string;

    splitBundleName?: string;

    /**
     * The name of the module.
     * 
     * @type {string}
     */
    moduleName?: string;
}
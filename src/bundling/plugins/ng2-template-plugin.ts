import { ComponentInfo } from '../../analysis/components/component-info';
import { ComponentContext } from '../../analysis/components/component-context';
import * as fs from 'fs';
import * as path from 'path';
import * as escodegen from 'escodegen';

/**
 * Plugin that allows the replacement of templateUrl and styleUrls from strings to require statements.
 * 
 * @export
 * @class Ng2TemplatePlugin
 */
export class Ng2TemplatePluginClass {
    
    public options: Ng2TemplatePluginOptions;

    public test: RegExp|string = /\.(j|t)s(x)?$/;

    constructor(options?: Ng2TemplatePluginOptions) {
        this.options = Object.assign({
            autoRequireStyles: true,
            autoRequireTemplates: true,
            templateUrlPattern: /templateUrl\s*:(\s*['"`](.*?)['"`]\s*([,}]))/gm,
            styleUrlsPattern: /styleUrls *:(\s*\[[^\]]*?\])/g,
            urlStringPattern: /(['`"])((?:[^\\]\\\1|.)*?)\1/g
        }, options);
        if (options && options.test) {
            this.test = options.test;
        }
    }

    public init(context) {

    }

    /**
     * Implements FuseBox Plugin's transform's method.  
     * 
     * @param {any} file 
     * @returns 
     */
    public transform(file) {
        let componentContext = new ComponentContext(file);
        let modified = false;
        
        for (let component of componentContext.components) {
            if (!this.options.ignoreTemplateUrl) {
                let templateUrl = component.metadata.templateUrl;
                if (templateUrl && typeof templateUrl.value === 'string') {
                    let oldValue = templateUrl.convertValueToRequireExpression();
                    component.renameMetadataProperty('templateUrl', 'template');
                    file.analysis.dependencies.push(oldValue);
                    modified = true;
                }
            }
            if (this.requireStyles(component, file)) {
                modified = true;
            }
        }

        if (modified) {
            file.contents = escodegen.generate(file.analysis.ast);
        }
    }

    public requireStyles(component: ComponentInfo, file): boolean {
        if (!this.options.ignoreStyleUrls) {
            let styleUrls = component.metadata.styleUrls;
            if (styleUrls) {
                let oldValues = styleUrls.convertValueToRequireExpression();
                component.renameMetadataProperty('styleUrls', 'styles');
                if (oldValues) {
                    for (let url of oldValues) {
                        file.analysis.dependencies.push(url);
                    }
                }
                return true;
            }
/*
            if (!component.hasMetadataProperty('styles') && this.options.autoRequireStyles) {
                
            }
*/
        }
        return false;
    }
}

/**
 * Returns a new instance of the Ng2TemplatePluginClass.
 * 
 * @export
 * @param {Ng2TemplatePluginOptions} [options] 
 * @returns 
 */
export function Ng2TemplatePlugin(options?: Ng2TemplatePluginOptions) {
    return new Ng2TemplatePluginClass(options);
}

/**
 * Options that can be passed to the Ng2TemplatePlugin
 */
export interface Ng2TemplatePluginOptions {
    /**
     * Whether or not to automatically require styles with matching filenames in the same folder location. Defaults to true.
     * 
     * @type {boolean}
     */
    autoRequireStyles?: boolean;
    /**
     * Whether or not to automatically require templates with matching filenames in the same folder location. Defaults to true.
     * 
     * @type {boolean}
     */
    autoRequireTemplates?: boolean;
    /**
     * Whether or not to ignore converting styleUrls properties. Defaults to false.
     * 
     * @type {boolean}
     * @memberOf Ng2TemplatePluginOptions
     */
    ignoreStyleUrls?: boolean;
    /**
     * Whether or not to ignore converting templateUrl properties. Defaults to false.
     * 
     * @type {boolean}
     * @memberOf Ng2TemplatePluginOptions
     */
    ignoreTemplateUrl?: boolean;
    /**
     * The test property for FuseBox plugins. Can be a regular expression or a string for a simplified regexp.
     * Defaults to '*.ts$|*.js$'.
     * 
     * @type {(RegExp|string)}
     */
    test?: RegExp|string;
}
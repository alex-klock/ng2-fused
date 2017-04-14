import * as path from 'path';

/**
 * Plugin that allows the replacement of templateUrl and styleUrls from strings to require statements.
 * 
 * @export
 * @class Ng2TemplatePlugin
 */
export class Ng2TemplatePluginClass {
    
    public get ignoreStyleUrls(): boolean {
        return this.options.ignoreStyleUrls;
    }

    public get ignoreTemplateUrl(): boolean {
        return this.options.ignoreTemplateUrl;
    }

    public options: Ng2TemplatePluginOptions;

    public get templateUrlPattern(): RegExp {
        return this.options.templateUrlPattern;
    }

    public get styleUrlsPattern(): RegExp {
        return this.options.styleUrlsPattern;
    }

    public get urlStringPattern(): RegExp {
        return this.options.urlStringPattern;
    }

    constructor(options?: Ng2TemplatePluginOptions) {
        this.options = Object.assign({
            templateUrlPattern: /templateUrl\s*:(\s*['"`](.*?)['"`]\s*([,}]))/gm,
            styleUrlsPattern: /styleUrls *:(\s*\[[^\]]*?\])/g,
            urlStringPattern: /(['`"])((?:[^\\]\\\1|.)*?)\1/g
        }, options);
    }
        
    /**
     * Implements FuseBox Plugin's onTypescriptTransform 's method.  
     * 
     * @param {any} file 
     * @returns 
     */
    public onTypescriptTransform(file) {      
        file.contents = this.transformSource(file.contents);
    }

    /**
     * Converts urls in a given input string to commonjs require expressions.
     * 
     * @param {string} input 
     * @returns {string} 
     */
    public replaceUrls(input: string): string {
        return input.replace(this.urlStringPattern, function (match, quote, url) {
            if (url[0] !== '.') {
                url = './' + url;
            }
            return `require('${url}')`;
        });
    }

    /**
     * Transforms the source by searching for template and style urls and converting them to require statements.
     * 
     * @param {string} source 
     */
    public transformSource(source: string): string {
        if (!this.ignoreTemplateUrl) {
            source = source.replace(this.templateUrlPattern, (match, url) => {
                return 'template:' + this.replaceUrls(url);
            });
        }
        if (!this.ignoreStyleUrls) {
            source = source.replace(this.styleUrlsPattern, (match, urls) => {
                return 'styles:' + this.replaceUrls(urls);
            });
        }
        return source;
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
    autoRequireStyles: boolean;
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
     * The regex pattern to search for the 'templateUrl' property in component metadata.
     * 
     * @type {RegExp}
     * @memberOf Ng2TemplatePluginOptions
     */
    templateUrlPattern?: RegExp;
    /**
     * The regex pattern to search for the 'styleUrls' property in component metadata.
     * 
     * @type {RegExp}
     * @memberOf Ng2TemplatePluginOptions
     */
    styleUrlsPattern?: RegExp;
    /**
     * The regex pattern to grab the string url within templateUrl and styleUrls properties.
     * 
     * @type {RegExp}
     * @memberOf Ng2TemplatePluginOptions
     */
    urlStringPattern?: RegExp;
}
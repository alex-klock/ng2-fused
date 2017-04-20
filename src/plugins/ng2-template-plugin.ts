import { ComponentContext } from './../components/component-context';
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
                if (component.metadata.templateUrl) {
                    if (component.metadata.templateUrl.node.key.name !== 'template') {
                        let value = component.metadata.templateUrl.value;

                        component.metadata.templateUrl.node.key.name = 'template';
                        component.metadata.templateUrl.node.value = {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'require'
                                
                            },
                            arguments: [{
                                type: 'Literal',
                                value: value
                            }]
                        };
                        file.analysis.dependencies.push(value);
                        modified = true;
                    }
                }
            }

            if (!this.options.ignoreStyleUrls) {
                if (component.metadata.styleUrls) {
                    let node = component.metadata.styleUrls.node;
                    if (node.key.name !== 'styles') {
                        node.key.name = 'styles';
                        if (node.value.type === 'ArrayExpression') {
                            for (let i = 0; i < node.value.elements.length; i++) {
                                let value = node.value.elements[i].value;

                                node.value.elements[i] = { 
                                    type: 'CallExpression', 
                                    callee: { type: 'Identifier', name: 'require' }, 
                                    arguments: [{ type: 'Literal', value: value }] 
                                };
                                file.analysis.dependencies.push(value);
                                modified = true;
                            }
                        }
                    }
                }
            }
            
        }

        if (modified) {
            file.contents = escodegen.generate(file.analysis.ast);
        }
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
import * as path from 'path';
import * as walk from 'acorn/dist/walk';
import * as escodegen from 'escodegen';
import { ComponentInfo, MetadataProperty } from './component-info';

/**
 * Represents a file that contains one or more components in it.
 * 
 * @export
 * @class ComponentContext
 */
export class ComponentContext {

    /**
     * The list of components found in the file.
     * 
     * @type {Ng2ComponentInfo[]}
     */
    public components: ComponentInfo[] = [];

    public filename: string;

    public fullFilePath: string;

    /**
     * Gets whether or not this context contains any components.
     * 
     * @readonly
     * @type {boolean}
     */
    public get hasComponents(): boolean {
        return this.components.length > 0;
    }

    /**
     * Gets the total number of components
     * 
     * @readonly
     * @type {number}
     */
    public get length(): number {
        return this.components ? this.components.length : 0;
    }

    constructor (file: { absPath: string, contents: string, analysis: any, loadContents() }) {
        this.fullFilePath = file.absPath;
        this.filename = path.basename(file.absPath);

        if (file.absPath.indexOf('.spec.') !== -1) {
            return null;
        }

        if (!file.analysis.ast) {
            file.loadContents()
            file.analysis.parseUsingAcorn()
            file.analysis.analyze()
        }

        // if the file has already been analyzed and a context created, return it.
        if (file.analysis.ng2ComponentContext) {
            return file.analysis.ng2ComponentContext;
        }

        walk.simple(file.analysis.ast, {
            CallExpression: (node: any) => {

                if (node.callee.name === 'Component' || (node.callee.type === 'MemberExpression' && node.callee.property.name === 'Component')) {
                    let info = new ComponentInfo();
                    let objectExpression = node.arguments[0];
                    if (objectExpression) {
                        let properties = objectExpression.properties;
                        if (properties) {
                            for (let property of properties) {
                                let metadata = new MetadataProperty(property);
                                info.metadata[metadata.key] = metadata;
                            }
                            
                            this.components.push(info);
                        }
                    }
                }
            }
        });
        file.analysis.ng2ComponentContext = this;
    }
}
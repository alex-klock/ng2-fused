import * as fs from 'fs';
import * as path from 'path';
import * as walk from 'acorn/dist/walk';
import * as escodegen from 'escodegen';
import { ComponentContext } from './component-context';
import { MetadataProperty } from './metadata-property';

/**
 * Represents information gathered about a component from analyzing its syntax tree.
 * 
 * @export
 * @class ComponentInfo
 */
export class ComponentInfo {

    public context: ComponentContext;

    public get directory(): string {
        return this.context ? path.dirname(this.context.fullFilePath) : null;
    }

    public metadata: ComponentMetadata;

    /**
     * Gets or sets the metadata node (ObjectExpression type node).
     */
    public get metadataNode(): any {
        return this._metadataNode;
    }

    public set metadataNode(value: any) {
        this.metadata = {};
        this._metadataNode = value;
        if (value) {
            let properties = value.properties;
            if (properties) {
                for (let property of properties) {
                    let metadata = new MetadataProperty(property);
                    this.metadata[metadata.key] = metadata;
                }
            }
        }
    }

    public name: string;

    private _metadataNode;

    constructor(context: ComponentContext) {
        this.context = context;
    }

    public addMetadataProperty(name: string, value: any) {
        if (!this._metadataNode || !name || !value) {
            return;
        }
        if (!this._metadataNode.properties) {
            this._metadataNode.properties = [];
        }

        let node = {
            type: 'Property',
            key: {
                type: 'Literal',
                value: name
            },
            kind: 'init',
            value: null
        };
        if (!Array.isArray(value)) {
            node.value = {
                type: 'Literal',
                value: value
            }
        } else {
            node.value = {
                type: 'ArrayExpression',
                elements: []
            }
            for (let elementValue of value) {
                node.value.elements.push({
                    type: 'Literal',
                    value: elementValue
                });
            }
        }

        this._metadataNode.properties.push(node);
        this.metadata[name] = new MetadataProperty(node);
    }

    /**
     * Gets all related files in the same directory as the component (filename matches everything except extension of the component's filename).
     */
    public getRelatedFiles(): string[] {
        return fs.readdirSync(this.directory).filter(f => path.parse(f).name === path.parse(this.context.filename).name);
    }

    public hasMetadataProperty(propertyName: string): boolean {
        return this.metadata[propertyName] ? true : false;
    }

    public removeMetadataProperty(propertyName: string): boolean {
        if (this.metadata) {
            let property = this.metadata[propertyName];

            if (property) {
                delete this.metadata[propertyName];
                for (let i = 0; i < this._metadataNode.properties.length; i++) {
                    let node = this._metadataNode.properties[i];
                    if (node.key.name === propertyName) {
                        this._metadataNode.properties.splice(i, 1);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public renameMetadataProperty(oldPropertyName: string, newPropertyName: string): boolean {
        let property: MetadataProperty = this.metadata[oldPropertyName];
        if (property && newPropertyName) {
            property.node.key.name = newPropertyName;
            this.metadata[newPropertyName] = property;
            delete this.metadata[oldPropertyName];
        }
        return false;
    }
}

/**
 * Represents information extracted from a component's metadata bindings. ie @Component({ templateUrl: 'value' }).
 * 
 * @export
 * @interface ComponentMetadata
 */
export interface ComponentMetadata {
    template?: MetadataProperty;
    templateUrl?: MetadataProperty;
    styles?: MetadataProperty;
    styleUrls?: MetadataProperty;
    [metadataName: string]: MetadataProperty;
}


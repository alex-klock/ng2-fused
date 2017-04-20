import * as path from 'path';
import * as walk from 'acorn/dist/walk';
import * as escodegen from 'escodegen';
import { ComponentContext } from './component-context';

/**
 * Represents information gathered about a component from analyzing its syntax tree.
 * 
 * @export
 * @class ComponentInfo
 */
export class ComponentInfo {

    public context: ComponentContext;

    public metadata: ComponentMetadata = {};

    public name: string;

    constructor(context: ComponentContext) {
        this.context = context;
    }

    public addMetadataProperty(name: string, value: any) {

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

/**
 * Represents a property of a given component metadata.
 * 
 * @export
 * @class MetadataProperty
 */
export class MetadataProperty {

    public get key(): string {
        // type: Identifier
        return this.node.key.name;
    }

    public get value(): string {
        if (this.node.value.type === 'ArrayExpression') {
            this.node.value.elements.filter(node => node.type === 'Identifier').map(node => node.value);
        }
        // type: Identifier
        return this.node.value.value;
    }

    /**
     * The syntax node for the metadata of type 'Property';
     * 
     * @type {*}
     */
    public node: any;

    constructor(propertyNode) {
        // type: Property, kind: init
        this.node = propertyNode;
    }

    public updateProperty(key: string, node) {
        this.node.key.name = key;
        this.node.value = node;
    }
}
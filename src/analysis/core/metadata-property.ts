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
            return this.node.value.elements.filter(node => node.type === 'Identifier').map(node => node.value);
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

    public addIdentifierValue(identifierName: string) {
        if (this.node.value.type === 'ArrayExpression') {
            this.node.value.elements.push({
                type: 'Identifier',
                name: identifierName
            });
        }
    }

    public addValue(node) {
        if (this.node.value.type === 'ArrayExpression') {
            this.node.value.elements.push(node);
        }
    }

    /**
     * Wraps the value as a require statement.  Ex, would turn a value of 'example' to require('example').
     */
    public convertValueToRequireExpression(): any {

        let oldValue = this.node.value;

        if (this.node.value.type === 'ArrayExpression') {

            let newValue = { type: 'ArrayExpression', elements: [] };

            for (let i = 0; i < this.node.value.elements.length; i++) {
                let value = this.node.value.elements[i].value;

                newValue.elements[i] = { 
                    type: 'CallExpression', 
                    callee: { type: 'Identifier', name: 'require' }, 
                    arguments: [{ type: 'Literal', value: value }] 
                };
            }
            this.node.value = newValue;

            return oldValue.elements.map(el => el.value);
        }
        
        this.node.value = {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'require' },
            arguments: [{ type: 'Literal', value: oldValue.value }]
        };

        return oldValue.value;
    }
}
import * as acorn from 'acorn';
import { Ng2TemplatePlugin, Ng2TemplatePluginClass } from './ng2-template-plugin';

describe('Ng2TemplatePlugin', () => {
    let plugin: Ng2TemplatePluginClass;

    describe('#transform', () => {

        beforeEach(() => {
            plugin = Ng2TemplatePlugin();
        })

        let components = [`
            Component({
                templateUrl: './something.html',
                styleUrls: ['./something.css']
            })`, `
            Component({
                styleUrls: ['./something.css'],
                templateUrl: './something.html'
            })
        `, `
            Component({
                selector: 'something', templateUrl: './something.html', styleUrls: ['./something.css']
            })
        `, `
            Component({
                templateUrl: "./something.html",
                styleUrls: ["./something.css"]
            })`, `
            Component({
                styleUrls: ["./something.css"],
                templateUrl: "./something.html"
            })
        `, `
            Component({
                selector: "something", templateUrl: "./something.html", styleUrls: ['./something.css']
            })
        `];

        components.forEach((component) => {
            let file = {
                absPath: '',
                analysis: {
                    ast: acorn.parse(component),
                    dependencies: []
                },
                contents: '',
                loadContents: function () { }
            };
            it('should convert the templateUrl', () => {
                file = {
                    absPath: '',
                    analysis: {
                        ast: acorn.parse(component),
                        dependencies: []
                    },
                    contents: '',
                    loadContents: function () { }
                };
                plugin.transform(file);
                expect(file.contents).toContain(`template: require('./something.html')`);
            });
            it('should convert the styleUrls', () => {
                plugin.transform(file);
                expect(file.contents).toContain(`styles: [require('./something.css')]`);
            });
        });

        it('should convert the styleUrls when there is multiple values', () => {
            let file = {
                absPath: '',
                analysis: {
                    ast: acorn.parse(`
                        Component({
                            templateUrl: './blah',
                            styleUrls: ['./something.css', './something-else.css']
                        })
                    `),
                    dependencies: []
                },
                contents: '',
                loadContents: function () { }
            };
            plugin.transform(file);
            expect(file.contents).toContain(`styles: [`);
            expect(file.contents).toContain(`require('./something.css')`);
            expect(file.contents).toContain(`require('./something-else.css')`);
        });

        it('should convert templateUrl when only property', () => {
            let file = {
                absPath: '',
                analysis: {
                    ast: acorn.parse(`Component({ templateUrl: './template.html' })`),
                    dependencies: []
                },
                contents: '',
                loadContents: function () { }
            };

            plugin.transform(file);
            expect(file.contents).toContain(`template: require('./template.html')`);
        });
    });
});

var test = { 
    "type": "Program", 
    "start": 0,
    "end": 151, 
    "body": [{ 
        "type": "ExpressionStatement", "start": 13, "end": 142, 
        "expression": { 
            "type": "CallExpression", "start": 13, "end": 142, 
            "callee": { "type": "Identifier", "start": 13, "end": 22, "name": "Component" }, 
            "arguments": [{ 
                "type": "ObjectExpression", "start": 23, "end": 141, 
                "properties": [{ 
                    "type": "Property", "start": 41, "end": 62, "method": false, "shorthand": false, "computed": false, 
                    "key": { "type": "Identifier", "start": 41, "end": 49, "name": "selector" }, 
                    "value": { "type": "Literal", "start": 51, "end": 62, "value": "something", "raw": "\"something\"" }, 
                    "kind": "init" 
                }, { 
                    "type": "Property", "start": 64, "end": 95, "method": false, "shorthand": false, "computed": false, 
                    "key": { "type": "Identifier", "start": 64, "end": 75, "name": "template" }, 
                    "value": { "type": "CallExpression", "callee": { "type": "Identifier", "name": "require" }, "arguments": [{ "type": "Literal" }] }, 
                    "kind": "init" 
                }, { 
                    "type": "Property", "start": 97, "end": 127, "method": false, "shorthand": false, "computed": false, 
                    "key": { "type": "Identifier", "start": 97, "end": 106, "name": "styles" }, 
                    "value": { 
                        "type": "ArrayExpression", "start": 108, "end": 127, 
                        "elements": [{ 
                            "type": "CallExpression", 
                            "callee": { "type": "Identifier", "name": "require" }, 
                            "arguments": [{ "type": "Literal" }] 
                        }] 
                    }, 
                    "kind": "init" 
                }] 
            }] 
        } 
    }], 
    "sourceType": "script" 
}
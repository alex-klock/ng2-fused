import * as path from 'path';
import * as acorn from 'acorn';
import * as walk from 'acorn/dist/walk';
import * as escodegen from 'escodegen';
import { NgContextItem } from './ng-context-item';

export class NgContext {

    public directory: string;
    
    public fileExtension: string;

    public filename: string;

    public fullFilePath: string;

    public ngItems: {
        directives?: NgContextItem[],
        components?: NgContextItem[],
        modules?: NgContextItem[],
        services?: NgContextItem[]
    } = {};

    private _file: any;

    constructor (file: { absPath: string, contents: string, analysis: any, loadContents() }) {
        this._file = file;
        let parsedPath = path.parse(file.absPath);

        this.directory = parsedPath.dir;
        this.fullFilePath = file.absPath;
        this.filename = parsedPath.base;
        this.fileExtension = parsedPath.ext;

        // Ignore spec files...
        if (file.absPath.indexOf('.spec.') !== -1) {
            return null;
        }

        if (!file.analysis.ast) {
            file.loadContents();
            file.analysis.parseUsingAcorn();
            file.analysis.analyze();
        }

        // if the file has already been analyzed and a context created, return it.
        if (file.analysis.ng2Fused) {
            return file.analysis.ng2Fused;
        }

        this._analyzeFile(file);
        
        file.analysis.ng2Fused = this;
    }

    public containsDecorator(node: any, decoratorName: string): boolean {
        return (node.callee.name === decoratorName || (node.callee.type === 'MemberExpression' && node.callee.property.name === decoratorName));
    }

    private _addNgContextItem(node: any, ancestors: any[], contextType: string) {
        let item = new NgContextItem(this);
        let objectExpression = node.arguments[0];
        item.metadataNode = objectExpression;
        if (!this.ngItems[contextType]) {
            this.ngItems[contextType] = [];
        }
        this.ngItems[contextType].push(item);

        let decorateIndex = ancestors.length - 3;
        if (decorateIndex >= 0) {
            let decorateNode = ancestors[decorateIndex];
            if (decorateNode.type === 'CallExpression' && decorateNode.arguments.length > 1) {
                let identifier = decorateNode.arguments[1];
                if (identifier.type === 'Identifier') {
                    item.name = identifier.name;
                }
            }
        }
    }

    public analyze(): void {
        this._file.analysis.parseUsingAcorn();
        this._file.analysis.analyze();
        this._analyzeFile(this._file);
    }

    private _analyzeFile(file) {
        this.ngItems = {};
        walk.ancestor(file.analysis.ast, {
            CallExpression: (node: any, ancestors: any) => {
                
                if (this.containsDecorator(node, 'Component')) {
                  

                    this._addNgContextItem(node, ancestors, 'components');
                }
                if (this.containsDecorator(node, 'NgModule')) {
                    this._addNgContextItem(node, ancestors, 'modules');
                }
            }
        });
    }
}
import { MetadataProperty } from '../core/metadata-property';
import { NgModuleContext } from './ng-module-context';

export class NgModuleInfo {

    public context: NgModuleContext;

    public metadata: NgModuleMetadata;

    constructor(context: NgModuleContext) {
        this.context = context;
    }
}

export interface NgModuleMetadata {
    bootstrap?: MetadataProperty;
    declarations?: MetadataProperty;
    exports?: MetadataProperty;
    imports?: MetadataProperty;
    providers?: MetadataProperty;
    [metadataName: string]: MetadataProperty;
}
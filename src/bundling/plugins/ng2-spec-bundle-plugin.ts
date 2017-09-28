import { File, Plugin, WorkFlowContext } from 'fuse-box';
import * as glob from 'glob';

/**
 * Automatically requires spec files within a spec bundle.
 * 
 * @export
 * @class Ng2SpecBundlePluginClass
 * @implements {Plugin}
 */
export class Ng2SpecBundlePluginClass implements Plugin {
    
    /**
     * 
     * 
     * @type {Ng2SpecBundleOptions}
     * @memberof Ng2SpecBundlePluginClass
     */
    public options: Ng2SpecBundleOptions;

    /**
     * The test for the spec-bundle... required specs will be injected into this file.
     * 
     * @memberof Ng2SpecBundlePluginClass
     */
    public test = /spec-bundle\.(ts|js)$/;
    
    public specs = [];

    constructor(options?: Ng2SpecBundleOptions) {
        this.options = Object.assign({
            cwd: 'build/workspace',
            specPathPrefix: '../',
            specPattern: '**/*.spec.ts'
        }, options);
    }

    /**
     * Event for start of bundle... look for spec files.
     * 
     * @param {WorkFlowContext} context 
     * @memberof Ng2SpecBundlePluginClass
     */
    public bundleStart(context: WorkFlowContext) {
        this.specs = glob.sync(this.options.specPattern, { cwd: this.options.cwd });
    }
    
    /**
     * Inject into spec bundle on transform.
     * 
     * @param {File} file 
     * @memberof Ng2SpecBundlePluginClass
     */
    public transform(file: File) {
        if (!file.analysis.ast) {
            file.loadContents();
            file.analysis.parseUsingAcorn();
            file.analysis.analyze();
        }
        file.contents = '';
        for (let spec of this.specs) {    
            let fusePath = spec.substr(0, spec.length - 3);
            let specFusePath = this.options.specPathPrefix + fusePath;
            file.contents += `
            require('${specFusePath}');`;
            file.analysis.dependencies.push(specFusePath);
        }
    }
    
}

export interface Ng2SpecBundleOptions {
    cwd?: string;
    /**
     * Glob pattern for finding specs.
     * 
     * @type {string}
     * @memberof Ng2SpecBundleOptions
     */
    specPattern?: string;

    specPathPrefix?: string;
}

export function Ng2SpecBundlePlugin(options?: Ng2SpecBundleOptions) {
    return new Ng2SpecBundlePluginClass(options);
}
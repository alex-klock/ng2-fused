import { Compiler, Injectable, NgModuleFactory, NgModuleFactoryLoader } from '@angular/core';

declare var $fsx: any;
declare var FuseBox: any;

function loadModule(browserPath: string, splitBundleName: string, fusePath: string): Promise<any> {

    let id = splitBundleName || browserPath;

    // Load with Quantum...
    if (typeof $fsx !== 'undefined') {
        if (!$fsx.l) {
            throw new Error(`Unable to lazy load module, please ensure FuseBox Quantum's lazy loading api is added.`);
        }
        return $fsx.l(id);
    }

    // Load with FuseBox...
    if (typeof FuseBox !== 'undefined') {
        return new Promise((resolve, reject) => {
            FuseBox.import(browserPath, (imported: any) => {
                if (imported) {
                    return resolve(require(fusePath));
                }
                reject(`Unable to lazy load bundle from '${browserPath}', bundle not found.`);
            });
        });
    }

    throw new Error(`Unable to lazy load bundle, no $fsx or FuseBox library found!`);
}

@Injectable()
export class NgFusedModuleLoader implements NgModuleFactoryLoader {
    
    constructor(private _compiler: Compiler) {

    }

    public load(path: string): Promise<NgModuleFactory<any>> {
        let isAot = this._compiler instanceof Compiler;

        return new Promise((resolve, reject) => {
            
            let split = path.split('#');
            let fusePath = split[0];
            let moduleSplit = split[1].split('?');
            let moduleName = moduleSplit[0];
            let queryParams: any = {};

            if (moduleSplit.length > 1) {
                let paramSplit = moduleSplit[1].split('&');
                for (let param of paramSplit) {
                    let kvp = param.split('=');
                    queryParams[kvp[0]] = kvp[1];
                }
            }

            let browserPath = queryParams['url'];
            let packageName = queryParams['pkg'];
            let splitBundleName = queryParams['split'];

            return loadModule(browserPath, splitBundleName, packageName + '/' + fusePath).then((imported: any) => {
                
                if (imported) {
                    let ngModule = imported[moduleName];
                    if (ngModule) {
                        // if JIT
                        if (!isAot) {
                            return this._compiler.compileModuleAsync(ngModule).then(factory => {
                                resolve(factory);
                            });
                        }
                        // otherwise aot and ngModule is already compiled to Factory
                        return resolve(ngModule);
                    } else {
                        return reject(`Bundle imported from '${browserPath}', but it did not contain module '${moduleName}'.`);
                    }
                }
                reject(`No bundle matching entry '${fusePath}' found in bundle at '${browserPath}'.`);
            });
        });
    }
}
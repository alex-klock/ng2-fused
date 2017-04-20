import { Ng2RouterPlugin, Ng2RouterPluginClass } from './ng2-router-plugin';

describe('Ng2RouterPlugin', () => {
    let plugin: Ng2RouterPluginClass;

    describe('#transformSource', () => {

        beforeEach(() => {
            plugin = Ng2RouterPlugin();
            Ng2RouterPluginClass.lazyModules = {};
        });

        it('should transform the loadChildren property from a string to a function returning a Promise', () => {
            expect(plugin.transformSource(`{ path: 'lazy', loadChildren: './+lazy/lazy.module#LazyModule' }`))
                .toContain('loadChildren: function () { return new Promise(function (resolve, reject) {');
        });
    });
});
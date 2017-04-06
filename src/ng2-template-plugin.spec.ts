import { Ng2TemplatePlugin, Ng2TemplatePluginClass } from './ng2-template-plugin';

describe('Ng2TemplatePlugin', () => {
    let plugin: Ng2TemplatePluginClass;

    describe('#transformSource', () => {
        
        beforeEach(() => {
            plugin = Ng2TemplatePlugin();
        })

        let components = [`
            @Component({
                templateUrl: './something.html',
                styleUrls: ['./something.css']
            })`, `
            @Component({
                styleUrls: ['./something.css'],
                templateUrl: './something.html'
            })
        `, `
            @Component({
                selector: 'something', templateUrl: './something.html', styleUrls: ['./something.css']
            })
        `, `
            @Component({
                templateUrl: "./something.html",
                styleUrls: ["./something.css"]
            })`, `
            @Component({
                styleUrls: ["./something.css"],
                templateUrl: "./something.html"
            })
        `, `
            @Component({
                selector: "something", templateUrl: "./something.html", styleUrls: ["./something.css"]
            })
        `];


        components.forEach((component) => {
            it('should convert the templateUrl', () => {
                let transform = plugin.transformSource(component);
                expect(transform).toContain(`template: require('./something.html')`);
            });
            it('should convert the styleUrls', () => {
                let transform = plugin.transformSource(component);
                expect(transform).toContain(`styles: [require('./something.css')]`);
            });
        });

        it('should convert the styleUrls when there is multiple values', () => {
            let transform = plugin.transformSource(`
                @Component({
                    styleUrls: ['./something.css', './something-else.css']
                })
            `);
            expect(transform).toContain(`styles: [require('./something.css'), require('./something-else.css')]`);
        });

        it('should convert templateUrl when only property', () => {
            expect(plugin.transformSource(`@Component({ templateUrl: './template.html' })`)).toContain(`template: require('./template.html')`);
        });
    });
});
import * as acorn from 'acorn';
import { NgContext } from './ng-context';

describe('ComponentInfo', () => {

    let context = new NgContext({
        absPath: '',
        analysis: {
            ast: acorn.parse(`
            function TestComponent() { }
            TestComponent = __decorate([core_1.Component({
                    select: 'test-comp',
                    template: require('./test.component.html'),
                    styles: [require('./test.component.css')]
                })], TestComponent);
            `)
        },
        contents: '',
        loadContents: function () {}
    });

    it('it should have extract a component info', () => {
        expect(context.ngItems.components.length).toEqual(1);
    });

});
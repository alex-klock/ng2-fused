import * as acorn from 'acorn';
import { ComponentContext } from './component-context';

describe('ComponentInfo', () => {

    let component = new ComponentContext({
        absPath: '',
        analysis: {
            ast: acorn.parse(`
                Component({ select: 'some-comp', templateUrl: './file' })
            `)
        },
        contents: '',
        loadContents: function () {}
    });

    it('it should have extract a component info', () => {
        expect(component.length).toEqual(1);
    });

});
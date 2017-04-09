import { TestComponent } from './test-helpers/components';
import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Rendering')

test('Does not schedule revalidation if we are current', (assert) => {
  let done = assert.async();
  let updates = 0;
  let data = [[1], [2]];

  class MyThing extends TestComponent {
    grid: Array<Array<number>>;

    constructor() {
      super();
      this.grid = data;
    }
  }

  class GridItem extends TestComponent {
    didUpdate() {
      updates++;
    }
  }

  let app = buildApp()
  .template('main', `<div><my-thing /></div>`)
  .template('my-thing', `
    <div>
    {{#each grid key="@index" as |gridRow|}}
      {{#each gridRow key="@index" as |gridItem|}}
        <grid-item />
      {{/each}}
    {{/each}}
    </div>
  `)
  .template('grid-item', '<h1>Hello</h1>')
  .component('grid-item', GridItem)
  .component('my-thing', MyThing)
  .boot();

  assert.equal(updates, 0, 'Does not update on initial render');

  setTimeout(() => {
    assert.equal(updates, 0, 'Does not update on initial render');
    app.rerender();
    assert.equal(updates, 0, 'Does not update on idempotent re-render');
    done();
  }, 1000);

});
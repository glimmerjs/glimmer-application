import { TestComponent } from './test-helpers/components';
import buildApp from './test-helpers/test-app';
import { tracked, setPropertyDidChange } from '@glimmer/component';

const { module, test } = QUnit;

module('Rendering')

test('Does not schedule revalidation if we are current', (assert) => {
  let done = assert.async();
  let updates = [];
  let data = [[1], [2]];
  let instance;

  class MyThing extends TestComponent {
    @tracked grid = data;

    constructor() {
      super();
      instance = this;
    }
  }

  class GridItem extends TestComponent {}

  let application = buildApp()
  .template('main', `<div><my-thing /></div>`)
  .helper('id', function(params) {
    updates.push(params[0]);
    return params[0];
  })
  .template('my-thing', `
    <div>
    {{#each grid key="@index" as |gridRow|}}
      {{#each gridRow key="@index" as |gridItem|}}
        <grid-item @item={{id gridItem}} />
      {{/each}}
    {{/each}}
    </div>
  `)
  .template('grid-item', '<h1>{{@item}}</h1>')
  .component('grid-item', GridItem)
  .component('my-thing', MyThing);

  let app = application.boot();

  setPropertyDidChange(function() {
    app.rerender();
  });

  setTimeout(() => {
    instance.grid = [[10], [9], [8]];
    assert.equal(updates, [1, 2, 10, 9, 8], 'Replacing the list should lead to updates');
  }, 1000);

  setTimeout(() => {
    instance.grid = instance.grid;
    assert.equal(updates, [1, 2, 10, 9, 8], 'Idempotent set');
  }, 1000);

  assert.deepEqual(updates, [1, 2], 'Does not update on initial render');
  app.rerender();
  assert.deepEqual(updates, [1, 2], 'Idempotent');
});
import { TestComponent } from './test-helpers/components';
import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Rendering')

test('Does not schedule revalidation if we are current', (assert) => {

  let updates = 0;

  class MyThing extends TestComponent {
    grid: Array<Array<number>>;

    constructor() {
      super()
      this.grid = [[1], [2]];
    }

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
  .component('grid-item', MyThing)
  .boot();

  assert.equal(updates, 0, 'Does not update on initial render');

  app.rerender();

  assert.equal(updates, 0, 'Does not update on idempotent re-render');
});
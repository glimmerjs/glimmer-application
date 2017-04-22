import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Rendering hooks');

test('beforeRender and afterRender fire for initial render and rerenders', function(assert) {
  let done = assert.async();
  assert.expect(4);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .setUp()
    .app;

  app.beforeRender(() => {
    assert.equal(containerElement.innerHTML, '');
  });

  app.beforeRerender(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
  });

  app.afterRender(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    app.scheduleRerender();
  });

  app.afterRerender(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    done();
  });

  app.renderComponent('hello-world', containerElement);
  app.boot();
});

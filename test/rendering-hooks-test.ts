import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('Rendering hooks');

test('afterRerender fires after rerenders', function(assert) {
  let done = assert.async();
  assert.expect(2);

  let containerElement = document.createElement('div');
  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '');

  app.app.afterRerender = function afterRerender() {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    done();
  };

  app.renderComponent('hello-world', containerElement);
});

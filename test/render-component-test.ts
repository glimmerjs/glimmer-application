import buildApp from './test-helpers/test-app';

const { module, test } = QUnit;

module('renderComponent');

test('renders a component', function(assert) {
  let done = assert.async();
  assert.expect(1);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot()
    .renderComponent('hello-world', containerElement)
    .andThen(() => {
      assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
      done();
    });
});

test('renders a component without affecting existing content', function(assert) {
  let done = assert.async();
  assert.expect(2);

  let containerElement = document.createElement('div');
  let previousSibling = document.createElement('p');

  previousSibling.appendChild(document.createTextNode('foo'));
  containerElement.appendChild(previousSibling);
  containerElement.appendChild(document.createTextNode('bar'));

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<p>foo</p>bar');

  app.renderComponent('hello-world', containerElement)
    .andThen(() => {
      assert.equal(containerElement.innerHTML, '<p>foo</p>bar<h1>Hello Glimmer!</h1>');
      done();
    });
});

test('renders a component before a given sibling', function(assert) {
  let done = assert.async();
  assert.expect(2);

  let containerElement = document.createElement('div');
  let previousSibling = document.createElement('p');
  let nextSibling = document.createElement('aside');

  containerElement.appendChild(previousSibling);
  containerElement.appendChild(nextSibling);

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<p></p><aside></aside>');

  app.renderComponent('hello-world', containerElement, nextSibling)
    .andThen(() => {
      assert.equal(containerElement.innerHTML, '<p></p><h1>Hello Glimmer!</h1><aside></aside>');
      done();
    });
});

test('renders multiple components in different places', function(assert) {
  let done = assert.async();
  assert.expect(2);

  let firstContainerElement = document.createElement('div');
  let secondContainerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .template('hello-robbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  app.renderComponent('hello-world', firstContainerElement);
  app.renderComponent('hello-robbie', secondContainerElement);

  app.andThen(() => {
    assert.equal(firstContainerElement.innerHTML, '<h1>Hello Glimmer!</h1>');
    assert.equal(secondContainerElement.innerHTML, '<h1>Hello Robbie!</h1>');
    done();
  });
});

test('renders multiple components in the same container', function(assert) {
  let done = assert.async();
  assert.expect(1);

  let containerElement = document.createElement('div');

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .template('hello-robbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  app.renderComponent('hello-world', containerElement);
  app.renderComponent('hello-robbie', containerElement);

  app.andThen(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Glimmer!</h1><h1>Hello Robbie!</h1>');
    done();
  });
});

test('renders multiple components in the same container in particular places', function(assert) {
  let done = assert.async();
  assert.expect(2);

  let containerElement = document.createElement('div');
  let nextSibling = document.createElement('aside');

  containerElement.appendChild(nextSibling);

  let app = buildApp()
    .template('hello-world', `<h1>Hello Glimmer!</h1>`)
    .template('hello-robbie', `<h1>Hello Robbie!</h1>`)
    .boot();

  assert.equal(containerElement.innerHTML, '<aside></aside>');

  app.renderComponent('hello-world', containerElement);
  app.renderComponent('hello-robbie', containerElement, nextSibling);

  app.andThen(() => {
    assert.equal(containerElement.innerHTML, '<h1>Hello Robbie!</h1><aside></aside><h1>Hello Glimmer!</h1>');
    done();
  });
});

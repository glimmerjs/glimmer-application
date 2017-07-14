import Application from '../src/application';
import buildApp from './test-helpers/test-app';
import { BlankResolver } from './test-helpers/resolvers';
import { Document } from 'simple-dom';
import { ComponentManager } from '@glimmer/component';

const { module, test } = QUnit;

module('Application');

test('can be instantiated', function(assert) {
  let app = new Application({ rootName: 'app', resolver: new BlankResolver });
  assert.ok(app, 'app exists');
});

test('accepts options for rootName, resolver and document', function(assert) {
  const resolver = new BlankResolver;
  let app = new Application({ rootName: 'app', resolver });
  assert.equal(app.rootName, 'app');
  assert.equal(app.resolver, resolver);
  assert.equal(app.document, window.document, 'defaults to window document if document is not provided in options');
  let customDocument = new Document();
  app = new Application({ rootName: 'app', resolver, document: customDocument });
  assert.equal(app.document, customDocument);
});

test('makes parent element available to the component manager', function(assert) {
  assert.expect(1);

  let parentElement;

  class FancyComponentManager extends ComponentManager {
    static create(options) {
      return new this(options);
    }
    create(env, def, args, dynamicScope) {
      parentElement = dynamicScope.get('_parentElement').value();

      return super.create(env, def, args);
    }
  }

  let app = buildApp('test-app', { ComponentManager: FancyComponentManager })
    .template('main', '<foo-bar>baz</foo-bar>')
    .boot();

  assert.equal(parentElement.outerHTML, '<div><foo-bar>baz</foo-bar></div>');
});

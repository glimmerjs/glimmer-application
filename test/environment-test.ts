import { getOwner, setOwner, Owner, OWNER, Factory } from '@glimmer/di';
import { UpdatableReference } from '@glimmer/object-reference';
import { DOMTreeConstruction, templateFactory } from '@glimmer/runtime';
import Environment, { EnvironmentOptions } from '../src/environment';
import Component, {
  ComponentManager
} from '@glimmer/component';
import DynamicScope from '../src/dynamic-scope';
import { precompile } from './test-helpers/compiler';

const { module, test } = QUnit;

module('Environment');

test('can be instantiated with new', function(assert) {
  let env = new Environment({
    document: self.document,
    appendOperations: new DOMTreeConstruction(self.document)
  });
  assert.ok(env, 'environment exists');
});

test('can be instantiated with create', function(assert) {
  let env = Environment.create();
  assert.ok(env, 'environment exists');
});

test('can be assigned an owner', function(assert) {
  class FakeApp implements Owner {
    identify(specifier: string, referrer?: string) { return ''; }
    factoryFor(specifier: string, referrer?: string) { return null; }
    lookup(specifier: string, referrer?: string) { return null; }
  }
  let app = new FakeApp;

  let options: EnvironmentOptions = {};
  setOwner(options, app);

  let env = Environment.create(options);
  assert.strictEqual(getOwner(env), app, 'owner has been set');
});

test('can render a component', function(assert) {
  class HelloWorld extends Component {
    static create() { return new this({}); }
  }

  let helloWorldTemplate = precompile(
    '<h1>Hello {{@name}}!</h1>',
    { meta: { specifier: 'template:/app/components/hello-world' }});

  let mainTemplate = precompile(
    '<hello-world @name={{salutation}} />',
    { meta: { specifier: 'template:/app/main/main' }});

  class FakeApp implements Owner {
    identify(specifier: string, referrer?: string): string {
      if (specifier === 'component:hello-world' &&
          referrer === 'template:/app/main/main') {
        return 'component:/app/components/hello-world';
      } else {
        throw new Error('Unexpected');
      }
    }

    factoryFor(specifier: string, referrer?: string): Factory<any> {
      if (specifier === 'component:/app/components/hello-world') {
        return HelloWorld;
      } else {
        throw new Error('Unexpected');
      }
    }

    lookup(specifier: string, referrer?: string): any {
      if (specifier === 'template' && referrer === 'component:/app/components/hello-world') {
        return helloWorldTemplate;
      } else {
        throw new Error('Unexpected');
      }
    }
  }

  let app = new FakeApp();
  let env = Environment.create({[OWNER]: app});

  let output = document.createElement('output');
  env.begin();

  let ref = new UpdatableReference({
    salutation: 'Glimmer'
  });

  let mainLayout = templateFactory(mainTemplate).create(env);
  mainLayout.render(ref, output, new DynamicScope());

  env.commit();

  assert.equal(output.innerText, 'Hello Glimmer!');
});

test('can render a component with the component helper', function(assert) {
  class HelloWorld extends Component {
    static create() { return new this({}); }
  }

  let helloWorldTemplate = precompile(
    '<h1>Hello {{@name}}!</h1>',
    { meta: { specifier: 'template:/app/components/hello-world' }});

  let mainTemplate = precompile(
    '{{component "hello-world" name=salutation}}',
    { meta: { specifier: 'template:/app/main/main' }});

  class FakeApp implements Owner {
    identify(specifier: string, referrer?: string): string {
      if (specifier === 'component:hello-world' &&
          referrer === 'template:/app/main/main') {
        return 'component:/app/components/hello-world';
      } else {
        throw new Error('Unexpected');
      }
    }

    factoryFor(specifier: string, referrer?: string): Factory<any> {
      if (specifier === 'component:/app/components/hello-world') {
        return HelloWorld;
      } else {
        throw new Error('Unexpected');
      }
    }

    lookup(specifier: string, referrer?: string): any {
      if (specifier === 'template' && referrer === 'component:/app/components/hello-world') {
        return helloWorldTemplate;
      } else {
        throw new Error('Unexpected');
      }
    }
  }

  let app = new FakeApp();
  let env = Environment.create({[OWNER]: app});

  let output = document.createElement('output');
  env.begin();

  let ref = new UpdatableReference({
    salutation: 'Glimmer'
  });

  let mainLayout = templateFactory(mainTemplate).create(env);
  let templateIterator = mainLayout.render(ref, output, new DynamicScope());
  let result;
  do {
    result = templateIterator.next();
  } while (!result.done);

  env.commit();

  assert.equal(output.innerText, 'Hello Glimmer!');
});

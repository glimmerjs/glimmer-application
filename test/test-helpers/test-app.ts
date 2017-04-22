import Application from '../../src/application';
import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';

import { TestComponent, TestComponentManager } from './components';
import { precompile } from './compiler';

export interface ComponentFactory {
  create(injections: object): TestComponent;
}

export default function buildApp(appName: string = 'test-app') {
  return new AppBuilder(appName);
}

export class TestApplication extends Application {
  rootElement: HTMLElement;
}

let moduleConfiguration = {
  types: {
    application: { definitiveCollection: 'main' },
    component: { definitiveCollection: 'components' },
    helper: { definitiveCollection: 'components' },
    renderer: { definitiveCollection: 'main' },
    template: { definitiveCollection: 'components' },
    util: { definitiveCollection: 'utils' },
    'component-manager': { definitiveCollection: 'component-managers' }
  },
  collections: {
    main: {
      types: ['application', 'renderer']
    },
    components: {
      group: 'ui',
      types: ['component', 'template', 'helper'],
      defaultType: 'component'
    },
    'component-managers': {
      types: ['component-manager']
    },
    utils: {
      unresolvable: true
    }
  }
};

export class AppBuilder {
  app: TestApplication;
  rootName: string;
  modules: any = {}

  constructor(name: string) {
    this.rootName = name;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = TestComponentManager;
    this.template('main', '<div />');
  }

  template(name: string, template: string) {
    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier, '<template-meta>': true }});
    return this;
  }

  component(name: string, componentFactory: ComponentFactory) {
    let specifier = `component:/${this.rootName}/components/${name}`;
    this.modules[specifier] = componentFactory;
    return this;
  }

  helper(name: string, helperFunc) {
    let specifier = `helper:/${this.rootName}/components/${name}`;
    this.modules[specifier] = helperFunc;
    return this;
  }

  setUp() {
    let resolverConfiguration = {
      app: { name: 'test-app', rootName: 'test-app' },
      types: moduleConfiguration.types,
      collections: moduleConfiguration.collections
    };

    let registry = new BasicModuleRegistry(this.modules);
    let resolver = new Resolver(resolverConfiguration, registry);
    let rootElement = document.createElement('div');

    let app = new TestApplication({
      rootName: this.rootName,
      resolver
    });

    app.rootElement = rootElement;
    app.renderComponent('main', rootElement, null);
    this.app = app;

    return this;
  }

  boot() {
    this.setUp();
    this.app.boot();

    return this.app;
  }
}

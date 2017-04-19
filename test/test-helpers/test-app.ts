import Resolver, { BasicModuleRegistry } from '@glimmer/resolver';
import Application from '../../src/application';

import { precompile } from './compiler';
import { TestComponent, TestComponentManager } from './components';

export interface ComponentFactory {
  create(injections: object): TestComponent;
}

export default function buildApp(appName: string = 'test-app') {
  return new AppBuilder(appName);
}

export class TestApplication extends Application {
  public rootElement: HTMLElement;
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
  public rootName: string;
  public modules: any = {};

  constructor(name: string) {
    this.rootName = name;
    this.modules[`component-manager:/${this.rootName}/component-managers/main`] = TestComponentManager;
    this.template('main', '<div />');
  }

  public template(name: string, template: string) {
    let specifier = `template:/${this.rootName}/components/${name}`;
    this.modules[specifier] = precompile(template, { meta: { specifier, '<template-meta>': true }});
    return this;
  }

  public component(name: string, componentFactory: ComponentFactory) {
    let specifier = `component:/${this.rootName}/components/${name}`;
    this.modules[specifier] = componentFactory;
    return this;
  }

  public helper(name: string, helperFunc) {
    let specifier = `helper:/${this.rootName}/components/${name}`;
    this.modules[specifier] = helperFunc;
    return this;
  }

  public boot() {
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

    app.boot();

    return app;
  }
}

import {
  Container,
  Factory,
  Owner,
  Registry,
  RegistryWriter,
  Resolver,
  setOwner,
} from '@glimmer/di';
import {
  Simple,
  templateFactory
} from '@glimmer/runtime';
import {
  VersionedPathReference
} from '@glimmer/reference';
import {
  UpdatableReference
} from '@glimmer/object-reference';
import ApplicationRegistry from './application-registry';
import DynamicScope from './dynamic-scope';
import Environment from './environment';

export interface ApplicationOptions {
  rootRef?: VersionedPathReference<object>;
  rootName: string;
  rootElement?: Simple.Element;
  resolver: Resolver;
}

export interface Initializer {
  name?: string;
  initialize(registry: RegistryWriter): void;
}

export default class Application implements Owner {
  public rootRef: VersionedPathReference<object>;
  public rootName: string;
  public rootElement: any;
  public resolver: Resolver;
  public env: Environment;
  private _registry: Registry;
  private _container: Container;
  private _renderResult: any; // TODO - type
  private _initializers: Initializer[] = [];
  private _initialized = false;

  constructor(options: ApplicationOptions) {
    this.rootName = options.rootName;
    this.rootElement = options.rootElement;
    this.rootRef = options.rootRef;
    this.resolver = options.resolver;
  }

  registerInitializer(initializer: Initializer) {
    this._initializers.push(initializer);
  }

  initialize(): void {
    let registry = this._registry = new Registry();

    // Create ApplicationRegistry as a proxy to the underlying registry
    // that will only be available during `initialize`.
    let appRegistry = new ApplicationRegistry(this._registry, this.resolver);

    registry.register(`environment:/${this.rootName}/main/main`, Environment);
    registry.registerOption('template', 'instantiate', false);
    registry.register(`document:/${this.rootName}/main/main`, window.document);
    registry.registerOption('document', 'instantiate', false);
    registry.registerInjection('environment', 'document', `document:/${this.rootName}/main/main`);
    registry.registerInjection('component-manager', 'env', `environment:/${this.rootName}/main/main`);

    let initializers = this._initializers;
    for (let i = 0; i < initializers.length; i++) {
      initializers[i].initialize(appRegistry);
    }

    this._initialized = true;
    this.initContainer();
  }

  initContainer(): void {
    this._container = new Container(this._registry, this.resolver);

    // Inject `this` (the app) as the "owner" of every object instantiated
    // by its container.
    this._container.defaultInjections = (specifier: string) => {
      let hash = {};
      setOwner(hash, this);
      return hash;
    }
  }

  boot(): void {
    this.initialize();

    this.env = this.lookup(`environment:/${this.rootName}/main/main`);

    if (!this.rootElement) {
      this.rootElement = this.env.getDOM().createElement('div');
      self.document.body.appendChild(this.rootElement);
    }

    if (!this.rootRef) {
      this.rootRef = new UpdatableReference({});
    }

    this.render();
  }

  render() {
    this.env.begin();

    let mainTemplate = this.lookup(`template:/${this.rootName}/components/main`);
    if (!mainTemplate) { throw new Error("Could not find main template."); }

    let mainLayout = templateFactory(mainTemplate).create(this.env);
    let templateIterator = mainLayout.render(this.rootRef, this.rootElement, new DynamicScope());
    let result;
    do {
      result = templateIterator.next();
    } while (!result.done);

    this.env.commit();

    this._renderResult = result.value;
  }

  rerender() {
    this.env.begin();
    this._renderResult.rerender();
    this.env.commit();
  }

  /**
   * Owner interface implementation
   */
  identify(specifier: string, referrer?: string): string {
    return this.resolver.identify(specifier, referrer);
  }

  factoryFor(specifier: string, referrer?: string): Factory<any> {
    return this._container.factoryFor(this.identify(specifier, referrer));
  }

  lookup(specifier: string, referrer?: string): any {
    return this._container.lookup(this.identify(specifier, referrer));
  }
}

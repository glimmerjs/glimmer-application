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
  templateFactory,
  RenderResult,
  ComponentDefinition,
  Component
} from '@glimmer/runtime';
import {
  CURRENT_TAG
} from '@glimmer/reference';
import {
  UpdatableReference
} from '@glimmer/object-reference';
import {
  Option
} from '@glimmer/util';
import ApplicationRegistry from './application-registry';
import DynamicScope from './dynamic-scope';
import Environment from './environment';
import mainTemplate from './templates/main';

export interface ApplicationOptions {
  rootName: string;
  resolver: Resolver;
}

export interface Initializer {
  name?: string;
  initialize(registry: RegistryWriter): void;
}

export interface AppRoot {
  id: number,
  component: string | ComponentDefinition<Component>,
  parent: Simple.Node,
  nextSibling: Option<Simple.Node>
}

export default class Application implements Owner {
  public rootName: string;
  public resolver: Resolver;
  public env: Environment;
  private _roots: AppRoot[] = [];
  private _rootsIndex: number = 0;
  private _registry: Registry;
  private _container: Container;
  private _renderResult: RenderResult;
  /** Whether the initial render has completed. */
  private _rendered: boolean;
  /** Whether a re-render has been scheduled. */
  private _scheduled: boolean;
  private _initializers: Initializer[] = [];
  private _initialized = false;
  private _lastRevision: number;

  constructor(options: ApplicationOptions) {
    this.rootName = options.rootName;
    this.resolver = options.resolver;
  }

  /** @hidden */
  registerInitializer(initializer: Initializer): void {
    this._initializers.push(initializer);
  }

  /** @hidden */
  initRegistry(): void {
    let registry = this._registry = new Registry();

    // Create ApplicationRegistry as a proxy to the underlying registry
    // that will only be available during `initialize`.
    let appRegistry = new ApplicationRegistry(this._registry, this.resolver);

    registry.register(`environment:/${this.rootName}/main/main`, Environment);
    registry.registerOption('helper', 'instantiate', false);
    registry.registerOption('template', 'instantiate', false);
    registry.register(`document:/${this.rootName}/main/main`, window.document as any);
    registry.registerOption('document', 'instantiate', false);
    registry.registerInjection('environment', 'document', `document:/${this.rootName}/main/main`);
    registry.registerInjection('component-manager', 'env', `environment:/${this.rootName}/main/main`);

    let initializers = this._initializers;
    for (let i = 0; i < initializers.length; i++) {
      initializers[i].initialize(appRegistry);
    }

    this._initialized = true;
  }

  /** @hidden */
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

  /** @hidden */
  initialize(): void {
    this.initRegistry();
    this.initContainer();
  }

  /** @hidden */
  boot(): void {
    this.initialize();

    this.env = this.lookup(`environment:/${this.rootName}/main/main`);

    this.render();
  }

  /** @hidden */
  render(): void {
    this.env.begin();

    let mainLayout = templateFactory(mainTemplate).create(this.env);
    let self = new UpdatableReference({ roots: this._roots });
    let appendTo = document.body;
    let dynamicScope = new DynamicScope();
    let templateIterator = mainLayout.render(self, appendTo, dynamicScope);
    let result;
    do {
      result = templateIterator.next();
    } while (!result.done);

    this._lastRevision = CURRENT_TAG.value();

    this.env.commit();

    this._rendered = true;
    this._renderResult = result.value;
  }

  renderComponent(component: string | ComponentDefinition<Component>, parent: Simple.Node, nextSibling: Option<Simple.Node>): void {
    this._roots.push({ id: this._rootsIndex++, component, parent, nextSibling });
    this.scheduleRerender();
  }

  /** @hidden */
  rerender(): void {
    if (CURRENT_TAG.validate(this._lastRevision)) { return; }

    this.env.begin();
    this._renderResult.rerender();
    this._lastRevision = CURRENT_TAG.value();
    this.env.commit();
  }

  /** @hidden */
  scheduleRerender(): void {
    if (this._scheduled || !this._rendered) { return; }

    this._scheduled = true;
    requestAnimationFrame(() => {
      this._scheduled = false;
      this.rerender();
    });
  }

  /**
   * Owner interface implementation
   *
   * @hidden
   */
  identify(specifier: string, referrer?: string): string {
    return this.resolver.identify(specifier, referrer);
  }

  /** @hidden */
  factoryFor(specifier: string, referrer?: string): Factory<any> {
    return this._container.factoryFor(this.identify(specifier, referrer));
  }

  /** @hidden */
  lookup(specifier: string, referrer?: string): any {
    return this._container.lookup(this.identify(specifier, referrer));
  }
}

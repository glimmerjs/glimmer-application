import { Factory } from '@glimmer/di';
import { UpdatableReference } from '@glimmer/object-reference';
import { Arguments, Bounds, CompiledDynamicProgram, ComponentDefinition, ComponentManager, DynamicScope, Template } from '@glimmer/runtime';
import ComponentDefinitionCreator from '../../src/component-definition-creator';
import Environment from '../../src/environment';
import TemplateMeta from '../../src/template-meta';

export class TestComponent {
  public static create(injections: object) {
    let component = new this();
    Object.assign(component, injections);
    return component;
  }

  public element: Element;
}

export class TestComponentDefinition extends ComponentDefinition<TestComponent> {
  public componentFactory: Factory<TestComponent>;
  public template: Template<TemplateMeta>;

  constructor(name: string, manager: TestComponentManager, template: Template<TemplateMeta>, componentFactory: Factory<TestComponent>) {
    super(name, manager, null);

    this.template = template;
    this.componentFactory = componentFactory;
  }

  public toJSON() {
    return `<test-component-definition name=${this.name}>`;
  }
}

export class TestComponentManager implements ComponentManager<TestComponent>, ComponentDefinitionCreator {
  public static create(injections: object): TestComponentManager {
    return new TestComponentManager(injections);
  }

  private env: Environment;

  constructor(injections: object) {
    Object.assign(this, injections);
  }

  public create(environment: Environment, definition: TestComponentDefinition, args: Arguments): TestComponent {
    if (!definition.componentFactory) { return; }
    return definition.componentFactory.create();
  }

  public createComponentDefinition(name: string, template: Template<TemplateMeta>, componentFactory?: Factory<TestComponent>): ComponentDefinition<TestComponent> {
    return new TestComponentDefinition(name, this, template, componentFactory);
  }

  public prepareArgs(definition: ComponentDefinition<TestComponent>, args: Arguments): null {
    return null;
  }

  public layoutFor(definition: TestComponentDefinition, component: TestComponent, env: Environment): CompiledDynamicProgram {
    let template = definition.template;
    let compiledLayout = template.asLayout().compileDynamic(this.env);

    return compiledLayout;
  }

  public getSelf(component: TestComponent) {
    return component ? new UpdatableReference(component) : null;
  }

  public didCreateElement(component: TestComponent, element: Element) {
    if (!component) { return; }
    component.element = element;
  }

  public didRenderLayout(component: TestComponent, bounds: Bounds) {
  }

  public didCreate(component: TestComponent) {
  }

  public getTag() {
    return null;
  }

  public update(component: TestComponent, scope: DynamicScope) {
  }

  public didUpdateLayout() {}

  public didUpdate() {}

  public getDestructor() {
    return null;
  }
}

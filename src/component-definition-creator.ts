import { Factory } from '@glimmer/di';
import { Component, ComponentDefinition, Template } from '@glimmer/runtime';
import TemplateMeta from './template-meta';

interface ComponentDefinitionCreator {
  createComponentDefinition(name: string, template: Template<TemplateMeta>, componentFactory?: Factory<Component>): ComponentDefinition<Component>;
}

export default ComponentDefinitionCreator;

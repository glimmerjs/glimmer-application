import Application from '../../src/application';

export default async function didRender(app: Application): Promise<void> {
  return new Promise<void>(resolve => {
    let watcher = setInterval(function() {
      if (app['_scheduled']) return;
      clearInterval(watcher);
      resolve();
    }, 10);
  });
}

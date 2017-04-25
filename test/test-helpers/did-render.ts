import Application from '../../src/application';

async function didRender(app: Application): Promise<void> {
  return new Promise<void>(resolve => {
    let watcher = setInterval(function() {
      if (app['_working']) return;
      clearInterval(watcher);
      resolve();
    }, 10);
  });
};

export default didRender;

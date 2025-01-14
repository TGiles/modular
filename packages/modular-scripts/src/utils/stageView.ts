import * as fs from 'fs-extra';
import path from 'path';
import { pascalCase as toPascalCase } from 'change-case';
import getModularRoot from './getModularRoot';
import getAllFiles from './getAllFiles';

export default function stageView(targetedView: string): string {
  const modularRoot = getModularRoot();

  const tempDir = path.join(modularRoot, 'node_modules', '.modular');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const stagedViewAppPath = path.join(tempDir, targetedView);
  if (!fs.existsSync(`${tempDir}/${targetedView}`)) {
    const appTypePath = path.join(__dirname, '../../types', 'app-view');
    fs.mkdirSync(`${tempDir}/${targetedView}`);
    fs.copySync(appTypePath, stagedViewAppPath);

    const packageFilePaths = getAllFiles(stagedViewAppPath);

    for (const packageFilePath of packageFilePaths) {
      fs.writeFileSync(
        packageFilePath,
        fs
          .readFileSync(packageFilePath, 'utf8')
          .replace(/PackageName__/g, toPascalCase(targetedView))
          .replace(/ComponentName__/g, toPascalCase(targetedView)),
      );
      if (path.basename(packageFilePath) === 'packagejson') {
        fs.moveSync(
          packageFilePath,
          packageFilePath.replace('packagejson', 'package.json'),
        );
      }
    }
  }

  // This optimizes repeated modular start <view> executions. If a tsconfig.json is present
  // we assume that this view has been staged before and we do not need to write to the index.tsx
  // file or write a tsconfig.json again
  if (!fs.existsSync(path.join(stagedViewAppPath, 'tsconfig.json'))) {
    const indexTemplate = `import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from '${targetedView}';

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);`;
    fs.writeFileSync(
      path.join(stagedViewAppPath, 'src', 'index.tsx'),
      indexTemplate,
    );
    fs.writeJSONSync(
      path.join(stagedViewAppPath, 'tsconfig.json'),
      {
        extends:
          path.relative(stagedViewAppPath, modularRoot) + '/tsconfig.json',
      },
      { spaces: 2 },
    );
  }
  return stagedViewAppPath;
}

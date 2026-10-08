import { statSync } from 'node:fs';
import { isAbsolute, join, normalize } from 'node:path';

export function guideRoot(environment: Readonly<NodeJS.ProcessEnv> = process.env): string {
  const configured = environment['MAPPING_IG_ROOT']?.trim();
  if (!configured) {
    throw new Error(
      'Set MAPPING_IG_ROOT to the absolute path of the openEHR-to-FHIR mapping IG checkout. ' +
        'Guide content is maintained outside this repository; see README.md.',
    );
  }
  if (!isAbsolute(configured)) {
    throw new Error('MAPPING_IG_ROOT must be an absolute path, independent of the npm working directory.');
  }

  const root = normalize(configured);
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`MAPPING_IG_ROOT is not a directory: ${root}`);
  }
  const config = join(root, 'sushi-config.yaml');
  if (!statSync(config, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`MAPPING_IG_ROOT must contain a sushi-config.yaml file: ${config}`);
  }
  const pages = join(root, 'input', 'pagecontent');
  if (!statSync(pages, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`MAPPING_IG_ROOT must contain an input/pagecontent directory: ${pages}`);
  }
  return root;
}

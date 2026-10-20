import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.overrideWebpackConfig(config => ({
  ...config,
  module: { ...config.module, rules: [
    ...(config.module?.rules || []),
    { test: /\.[cm]?jsx?$/, resolve: { fullySpecified: false } },
  ] },
  resolve: { ...config.resolve, alias: { ...config.resolve?.alias, '@': path.resolve('src') } },
}));

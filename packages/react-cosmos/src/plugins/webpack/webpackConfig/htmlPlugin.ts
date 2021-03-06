import { Options as HtmlWebpackPluginOptions } from 'html-webpack-plugin';
import importFrom from 'import-from';
import { omit } from 'lodash';
import webpack from 'webpack';
import { CosmosConfig } from '../../../config';
import { RENDERER_FILENAME } from '../../../shared/playgroundHtml';
import { hasPlugin, isInstanceOfPlugin } from './shared';

export type HtmlWebpackPlugin = webpack.WebpackPluginInstance & {
  constructor: HtmlWebpackPluginConstructor;
  options: HtmlWebpackPluginOptions;
};

type HtmlWebpackPluginConstructor = new (
  options?: HtmlWebpackPluginOptions
) => HtmlWebpackPlugin;

export function ensureHtmlWebackPlugin(
  { rootDir }: CosmosConfig,
  plugins: webpack.WebpackPluginInstance[]
): webpack.WebpackPluginInstance[] {
  if (hasPlugin(plugins, 'HtmlWebpackPlugin')) {
    return plugins.map(plugin =>
      isHtmlWebpackPlugin(plugin) ? changeHtmlPluginFilename(plugin) : plugin
    );
  }

  const htmlWebpackPlugin = getHtmlWebpackPlugin(rootDir);
  if (!htmlWebpackPlugin) {
    return plugins;
  }

  return [
    ...plugins,
    new htmlWebpackPlugin({
      title: 'React Cosmos',
      filename: RENDERER_FILENAME,
    }),
  ];
}

export function getHtmlWebpackPlugin(rootDir: string) {
  return importFrom.silent<HtmlWebpackPluginConstructor>(
    rootDir,
    'html-webpack-plugin'
  );
}

function isHtmlWebpackPlugin(
  plugin: webpack.WebpackPluginInstance
): plugin is HtmlWebpackPlugin {
  return isInstanceOfPlugin(plugin, 'HtmlWebpackPlugin');
}

function changeHtmlPluginFilename(htmlPlugin: HtmlWebpackPlugin) {
  if (!isIndexHtmlWebpackPlugin(htmlPlugin)) return htmlPlugin;

  const safeOptions = omit(
    htmlPlugin.options || htmlPlugin.userOptions,
    'chunks'
  ) as HtmlWebpackPlugin['options'];
  return new htmlPlugin.constructor({
    ...safeOptions,
    filename: RENDERER_FILENAME,
  });
}

function isIndexHtmlWebpackPlugin(htmlPlugin: HtmlWebpackPlugin) {
  const { filename } = htmlPlugin.options || htmlPlugin.userOptions;
  return (
    filename === 'index.html' ||
    typeof filename !== 'string' ||
    filename.endsWith('/index.html')
  );
}
